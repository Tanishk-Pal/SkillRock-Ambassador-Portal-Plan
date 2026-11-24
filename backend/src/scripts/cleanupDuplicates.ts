import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { TaskSubmission } from '../models/TaskSubmission';
import { PointsTransaction } from '../models/PointsTransaction';

dotenv.config();

export async function cleanupDuplicateSubmissions() {
  await connectDB();
  console.log('[Cleanup] Starting duplicate task submissions cleanup in ssap_campus_db...');

  const allSubmissions = await TaskSubmission.find({}).lean();
  console.log(`[Cleanup] Total submissions found before cleanup: ${allSubmissions.length}`);

  const groups: Record<string, typeof allSubmissions> = {};
  for (const sub of allSubmissions) {
    const key = `${sub.taskId.toString()}_${sub.ambassadorId.toString()}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(sub);
  }

  let totalDuplicateGroups = 0;
  let totalDeletedDuplicates = 0;
  const nonDuplicateIds = new Set<string>();

  for (const [key, submissions] of Object.entries(groups)) {
    if (submissions.length === 1) {
      nonDuplicateIds.add(submissions[0]._id.toString());
      continue;
    }

    totalDuplicateGroups++;
    // Sort ascending by createdAt, submittedAt, or _id timestamp to find earliest
    submissions.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.submittedAt || a._id.getTimestamp()).getTime();
      const timeB = new Date(b.createdAt || b.submittedAt || b._id.getTimestamp()).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a._id.toString().localeCompare(b._id.toString());
    });

    const earliest = submissions[0];
    const redundant = submissions.slice(1);
    const redundantIds = redundant.map((r) => r._id);

    console.log(
      `[Cleanup] Duplicate group for Task ${earliest.taskId} & Ambassador ${earliest.ambassadorId} (SRID: ${earliest.srid}):`
    );
    console.log(
      `  -> Retaining EARLIEST submission: ${earliest._id} (status: ${earliest.status}, created: ${earliest.createdAt})`
    );
    console.log(
      `  -> Removing ${redundant.length} redundant duplicate(s): ${redundantIds.map((id) => id.toString()).join(', ')}`
    );

    // Update any PointsTransaction references that pointed to removed redundant submissions
    await PointsTransaction.updateMany(
      { relatedSubmissionId: { $in: redundantIds } },
      { $set: { relatedSubmissionId: earliest._id } }
    );

    // Delete redundant duplicates
    const deleteResult = await TaskSubmission.deleteMany({ _id: { $in: redundantIds } });
    totalDeletedDuplicates += deleteResult.deletedCount;
  }

  console.log(`\n[Cleanup] Results:`);
  console.log(`  Duplicate groups identified & cleaned: ${totalDuplicateGroups}`);
  console.log(`  Redundant duplicate records removed: ${totalDeletedDuplicates}`);

  // Post-cleanup verification
  const remainingSubmissions = await TaskSubmission.find({}).lean();
  console.log(`  Remaining submissions count: ${remainingSubmissions.length}`);

  // Verify uniqueness of remaining
  const remainingKeys = new Set<string>();
  let postCleanupDuplicates = 0;
  for (const sub of remainingSubmissions) {
    const key = `${sub.taskId.toString()}_${sub.ambassadorId.toString()}`;
    if (remainingKeys.has(key)) {
      postCleanupDuplicates++;
    }
    remainingKeys.add(key);
  }

  if (postCleanupDuplicates === 0) {
    console.log('  ✅ VERIFIED: Zero duplicate task submissions remain in tasksubmissions.');
  } else {
    throw new Error(`❌ FAILED: ${postCleanupDuplicates} duplicate submissions still found!`);
  }

  // Verify non-duplicate records were not deleted
  for (const id of nonDuplicateIds) {
    const exists = remainingSubmissions.some((s) => s._id.toString() === id);
    if (!exists) {
      throw new Error(`❌ FAILED: Non-duplicate submission ${id} was deleted!`);
    }
  }
  console.log('  ✅ VERIFIED: All non-duplicate submissions are preserved untouched.');
}

if (require.main === module) {
  cleanupDuplicateSubmissions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Cleanup] Error during cleanup:', err);
      process.exit(1);
    });
}
