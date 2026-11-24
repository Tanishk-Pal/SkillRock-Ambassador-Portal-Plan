import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import { seedDatabase } from '../scripts/seed';
import { Ambassador } from '../models/Ambassador';
import { Admin } from '../models/Admin';
import { Task } from '../models/Task';
import { TaskSubmission } from '../models/TaskSubmission';
import { CourseSale } from '../models/CourseSale';
import { PointsTransaction } from '../models/PointsTransaction';
import { Application } from '../models/Application';
import { awardOrDeductPoints } from '../services/pointsService';
import { processCourseSale } from '../services/salesService';
import { generateNextSRID } from '../services/sridService';
import { submitTask } from '../controllers/taskController';
import { preventDuplicateSubmission } from '../routes/taskRoutes';

dotenv.config();

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting SkillRock Ambassador Portal Backend E2E Tests');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    await connectDB();
    await seedDatabase();

    // Test 1: Admin Account Exists
    const admin = await Admin.findOne({ email: 'admin@skillrock.in' });
    assert(!!admin, 'Admin account exists in database');
    const isPwValid = admin ? await bcrypt.compare('Admin@SSAP2026!', admin.passwordHash) : false;
    assert(isPwValid, 'Admin password hashes and verifies correctly');

    // Test 2: Dynamic 4 Task Slots Exist
    const tasks = await Task.find({ status: 'active' }).sort({ taskNumber: 1 });
    assert(tasks.length >= 4, `At least 4 dynamic tasks exist (found ${tasks.length})`);
    assert(tasks[0].taskNumber === 1 && !!tasks[0].title, 'Task 1 has valid number and title');

    // Test 3: SRID Generation
    const nextSRID = await generateNextSRID();
    assert(nextSRID.startsWith('SR'), `Next SRID format is valid (${nextSRID})`);

    // Test 4: Create Test Ambassador
    const testEmail = `test.ambassador.${Date.now()}@skillrock.in`;
    const testSRID = nextSRID;
    const testPw = 'Test@Ambassador2026';
    const pwHash = await bcrypt.hash(testPw, 12);

    const testAmb = await Ambassador.create({
      srid: testSRID,
      name: 'Test Ambassador Tanishk',
      email: testEmail,
      college: 'SkillRock Engineering Institute',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      passwordHash: pwHash,
      totalPoints: 0,
      currentRank: 1,
      badgeTier: 'The Explorer',
      badges: ['The Explorer'],
      status: 'active',
    });
    assert(!!testAmb && testAmb.srid === testSRID, `Ambassador created with SRID ${testSRID}`);

    // Test 5: Verify Ambassador Credentials
    const isAmbPwMatch = await bcrypt.compare(testPw, testAmb.passwordHash!);
    assert(isAmbPwMatch, 'Ambassador password hash verification succeeds');

    // Test 6: Task Submission Workflow
    const targetTask = tasks[0];
    const submission = await TaskSubmission.create({
      taskId: targetTask._id,
      ambassadorId: testAmb._id,
      srid: testAmb.srid,
      submissionData: {
        textResponse: 'Completed Build Night workshop with 8 students attending.',
        links: ['https://drive.google.com/drive/folders/sample-proof'],
      },
      status: 'submitted',
      submittedAt: new Date(),
    });
    assert(!!submission && submission.status === 'submitted', 'Task submission created in submitted status');

    // Test 7: Submission Approval & Atomic Points Award
    const pointsAwarded = targetTask.points;
    submission.status = 'approved';
    submission.awardedPoints = pointsAwarded;
    submission.adminFeedback = 'Great session proof verified!';
    submission.reviewedAt = new Date();
    await submission.save();

    await awardOrDeductPoints({
      ambassadorId: testAmb._id,
      amount: pointsAwarded,
      type: 'task_completion',
      reason: `Completed Task #${targetTask.taskNumber}: ${targetTask.title}`,
      relatedTaskId: targetTask._id,
      relatedSubmissionId: submission._id,
      adminId: admin!._id,
    });

    const updatedAmb = await Ambassador.findById(testAmb._id);
    assert(
      updatedAmb!.totalPoints === pointsAwarded,
      `Ambassador totalPoints updated from 0 to ${pointsAwarded}`
    );

    // Test 8: Points Transaction Recorded
    const tx = await PointsTransaction.findOne({
      ambassadorId: testAmb._id,
      relatedSubmissionId: submission._id,
    });
    assert(!!tx && tx.amount === pointsAwarded, 'PointsTransaction audit record created');

    // Test 9: Course Sales Referral Attribution (₹199 course, 20% commission)
    const orderId = `ORD-TEST-${Date.now()}`;
    const paymentId = `PAY-TEST-${Date.now()}`;
    const saleResult = await processCourseSale({
      orderId,
      paymentId,
      courseId: 'python-programming-zero-to-hero-beginner-to-project-builder',
      courseName: 'Applied Python Programming & Software Development',
      coursePrice: 199.0,
      srid: testAmb.srid,
      paymentStatus: 'paid',
      buyerName: 'Aarav Student',
      buyerEmail: 'aarav.student@test.edu',
    });

    assert(saleResult.isNew, 'Course sale recorded as new attribution');
    assert(saleResult.sale.commissionRate === 20, '20% commission rate applied');
    assert(saleResult.sale.commissionAmount === 39.8, 'Commission calculated accurately (₹39.80)');

    // Test 10: Anti-Replay Duplicate Sale Check
    const duplicateSale = await processCourseSale({
      orderId,
      paymentId,
      courseId: 'python-programming-zero-to-hero-beginner-to-project-builder',
      courseName: 'Applied Python Programming & Software Development',
      coursePrice: 199.0,
      srid: testAmb.srid,
      paymentStatus: 'paid',
    });
    assert(!duplicateSale.isNew, 'Duplicate sale correctly identified and prevented');

    // Test 11: 1-Click Applicant Conversion
    const sampleApplicant = await Application.create({
      fullName: 'Vikramaditya Rao',
      email: `vikram.${Date.now()}@campus.edu`,
      phone: '9876543210',
      college: 'National Institute of Technology',
      city: 'Nagpur',
      state: 'Maharashtra',
      status: 'shortlisted',
    });

    const convertedSrid = await generateNextSRID();
    const convertedAmb = await Ambassador.create({
      srid: convertedSrid,
      name: sampleApplicant.fullName,
      email: sampleApplicant.email,
      college: sampleApplicant.college,
      city: sampleApplicant.city,
      state: sampleApplicant.state,
      phone: sampleApplicant.phone,
      passwordHash: await bcrypt.hash('SkillRock@2026', 12),
      totalPoints: 100,
      badgeTier: 'The Explorer',
      badges: ['The Explorer'],
      status: 'active',
      applicationId: sampleApplicant._id,
    });
    sampleApplicant.convertedToAmbassador = true;
    sampleApplicant.ambassadorSrid = convertedSrid;
    await sampleApplicant.save();

    assert(
      sampleApplicant.convertedToAmbassador && convertedAmb.srid === convertedSrid,
      `Applicant 1-click converted to Ambassador with SRID ${convertedSrid}`
    );

    // =========================================================================
    // Duplicate Task Submission Prevention Tests
    // =========================================================================
    const mockReqRes = (taskId: string, user: any, body: any = {}) => {
      let statusCode = 200;
      let responseData: any = null;
      const listeners: Record<string, Function[]> = {};
      const req = {
        params: { taskId },
        user,
        body,
        files: [],
      } as any;
      const res = {
        on(event: string, fn: Function) {
          listeners[event] = listeners[event] || [];
          listeners[event].push(fn);
          return this;
        },
        removeListener(event: string, fn: Function) {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((f) => f !== fn);
          }
          return this;
        },
        emit(event: string) {
          if (listeners[event]) {
            [...listeners[event]].forEach((fn) => fn());
          }
        },
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          responseData = data;
          this.emit('finish');
          return this;
        },
      } as any;
      return {
        req,
        res,
        getStatus: () => statusCode,
        getData: () => responseData,
        emitFinish: () => res.emit('finish'),
      };
    };

    const getValidBodyForTask = (t: any) => {
      const type = t.submissionType;
      if (type === 'reel_challenge') {
        return {
          instagramReelUrl: 'https://www.instagram.com/reel/test_reel_123/',
          linkedinPostUrl: 'https://www.linkedin.com/posts/test_reel_123',
        };
      }
      if (type === 'monthly_highlight') {
        return {
          linkedinPostUrl: 'https://www.linkedin.com/posts/test_highlight_123',
        };
      }
      if (type === 'campus_growth') {
        return {
          studentsReached: 15,
          registrationsGenerated: 8,
          studentsLearningStarted: 6,
          driveVideoLinks: ['https://drive.google.com/file/d/test1234/view'],
        };
      }
      if (type === 'affiliate_sales') {
        return {
          coursesPromotedCount: 3,
          salesGeneratedCount: 2,
          courseNames: 'Applied Python Programming, Web Engineering',
        };
      }
      return {
        textResponse: 'Completed task submission proof',
        links: ['https://drive.google.com/test_folder'],
      };
    };

    // Test 12: Sequential Duplicate Submission Prevention
    const dupTestTask = tasks[1] || tasks[0];
    const validBodyTask1 = getValidBodyForTask(dupTestTask);

    const call1 = mockReqRes(dupTestTask._id.toString(), { id: testAmb._id, srid: testAmb.srid }, validBodyTask1);
    await submitTask(call1.req, call1.res);
    assert(call1.getStatus() === 201, 'First task submission succeeds with 201 Created');

    const call2 = mockReqRes(dupTestTask._id.toString(), { id: testAmb._id, srid: testAmb.srid }, validBodyTask1);
    await submitTask(call2.req, call2.res);
    assert(
      call2.getStatus() === 400 && call2.getData()?.success === false,
      'Consecutive duplicate submission is rejected with 400 Bad Request'
    );

    const dupCount1 = await TaskSubmission.countDocuments({
      taskId: dupTestTask._id,
      ambassadorId: testAmb._id,
    });
    assert(dupCount1 === 1, `Sequential duplicate attempt produced exactly 1 database record (found ${dupCount1})`);

    // Test 13: Rapid Concurrent Task Submission Prevention
    const concurrentTask = tasks[2] || tasks[0];
    const validBodyTask2 = getValidBodyForTask(concurrentTask);

    const concurrentCalls = Array.from({ length: 5 }, () => {
      const mock = mockReqRes(
        concurrentTask._id.toString(),
        { id: testAmb._id, srid: testAmb.srid },
        validBodyTask2
      );
      return submitTask(mock.req, mock.res).then(() => ({
        status: mock.getStatus(),
        data: mock.getData(),
      }));
    });

    const concurrentResults = await Promise.all(concurrentCalls);
    const createdCount = concurrentResults.filter((r) => r.status === 201).length;
    const rejectedCount = concurrentResults.filter((r) => r.status === 400).length;

    assert(
      createdCount === 1,
      `Exactly 1 of 5 concurrent submissions succeeded with 201 Created (found ${createdCount})`
    );
    assert(
      rejectedCount === 4,
      `Remaining 4 of 5 concurrent submissions rejected with 400 (found ${rejectedCount})`
    );

    const concurrentDbCount = await TaskSubmission.countDocuments({
      taskId: concurrentTask._id,
      ambassadorId: testAmb._id,
    });
    assert(
      concurrentDbCount === 1,
      `Concurrent submission attempts resulted in exactly 1 database record in tasksubmissions (found ${concurrentDbCount})`
    );

    // Test 14: MongoDB Unique Index Enforcement
    let caughtMongoDuplicateError = false;
    try {
      await TaskSubmission.create({
        taskId: concurrentTask._id,
        ambassadorId: testAmb._id,
        srid: testAmb.srid,
        submissionData: validBodyTask2,
        status: 'submitted',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        caughtMongoDuplicateError = true;
      }
    }
    assert(
      caughtMongoDuplicateError,
      'Direct duplicate insertion triggers MongoDB E11000 uniqueness constraint violation'
    );

    // Test 15: preventDuplicateSubmission In-Flight Mutex & Pre-Upload Interception
    const middlewareTask = tasks[3] || tasks[0];
    const mCall1 = mockReqRes(middlewareTask._id.toString(), { id: testAmb._id, srid: testAmb.srid });
    let mNext1Called = false;
    await preventDuplicateSubmission(mCall1.req, mCall1.res, () => {
      mNext1Called = true;
    });
    assert(mNext1Called, 'First request cleanly passes preventDuplicateSubmission middleware to next()');

    // While mCall1 is in flight (has not finished/closed), concurrent mCall2 must be blocked with 409 Conflict
    const mCall2 = mockReqRes(middlewareTask._id.toString(), { id: testAmb._id, srid: testAmb.srid });
    let mNext2Called = false;
    await preventDuplicateSubmission(mCall2.req, mCall2.res, () => {
      mNext2Called = true;
    });
    assert(
      !mNext2Called && mCall2.getStatus() === 409,
      'Concurrent in-flight duplicate submission is rejected by middleware with 409 Conflict'
    );

    // Release mCall1 in-flight lock via finish
    mCall1.emitFinish();

    // Now test pre-upload check for already submitted task (concurrentTask already exists in db)
    const mCallPreUpload = mockReqRes(concurrentTask._id.toString(), { id: testAmb._id, srid: testAmb.srid });
    let mNextPreUploadCalled = false;
    await preventDuplicateSubmission(mCallPreUpload.req, mCallPreUpload.res, () => {
      mNextPreUploadCalled = true;
    });
    assert(
      !mNextPreUploadCalled && mCallPreUpload.getStatus() === 400,
      'Pre-upload middleware rejects duplicate submission with 400 before Multer disk writes'
    );

    // Test 16: Resubmission flow on Rejected Task preserves uniqueness
    // Mark dupTestTask submission as rejected
    await TaskSubmission.updateOne(
      { taskId: dupTestTask._id, ambassadorId: testAmb._id },
      { $set: { status: 'rejected', adminFeedback: 'Please provide updated proof.' } }
    );

    const resubmitCall = mockReqRes(dupTestTask._id.toString(), { id: testAmb._id, srid: testAmb.srid }, validBodyTask1);
    await submitTask(resubmitCall.req, resubmitCall.res);
    assert(
      resubmitCall.getStatus() === 201 &&
        resubmitCall.getData()?.submission.resubmissionCount === 1 &&
        resubmitCall.getData()?.submission.status === 'submitted',
      'Rejected task resubmission succeeds with 201, increments resubmissionCount to 1, and updates existing document'
    );

    const resubmitDbCount = await TaskSubmission.countDocuments({
      taskId: dupTestTask._id,
      ambassadorId: testAmb._id,
    });
    assert(
      resubmitDbCount === 1,
      `Resubmitted task maintains exactly 1 database record in tasksubmissions (found ${resubmitDbCount})`
    );

    // Clean up test records
    await Ambassador.findByIdAndDelete(testAmb._id);
    await Ambassador.findByIdAndDelete(convertedAmb._id);
    await TaskSubmission.findByIdAndDelete(submission._id);
    await TaskSubmission.deleteMany({ ambassadorId: testAmb._id });
    await CourseSale.findByIdAndDelete(saleResult.sale._id);
    await PointsTransaction.deleteMany({ ambassadorId: testAmb._id });
    await Application.findByIdAndDelete(sampleApplicant._id);
    console.log('\n  🧹 Cleaned up temporary test artifacts.');
  } catch (err: any) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().then(() => process.exit(0));
