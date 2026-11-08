import mongoose from 'mongoose';
import { CourseSale } from '../models/CourseSale';
import { Ambassador } from '../models/Ambassador';
import { CommissionSetting } from '../models/CommissionSetting';
import { awardOrDeductPoints } from './pointsService';

/**
 * Automatically synchronizes course purchases from the main SkillRock platform database (`skillswap_campus.payments`)
 * into the Ambassador Portal (`ssap_campus_db.coursesales`).
 * 
 * Works seamlessly whether checkout stores `srid`, `ambassador_srid`, `referral_srid`, or `referral_code`.
 */
export const syncSalesFromSkillrockPayments = async () => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return { syncedCount: 0, updatedCount: 0 };
    }

    const mainDb = mongoose.connection.useDb('skillswap_campus');
    const paymentsCollection = mainDb.collection('payments');
    const checkoutSessionsCollection = mainDb.collection('checkout_sessions');

    // 1. Fetch any payments containing ambassador attribution directly
    const attributedPayments = await paymentsCollection
      .find({
        $or: [
          { srid: { $exists: true, $ne: '' } },
          { ambassador_srid: { $exists: true, $ne: '' } },
          { referral_srid: { $exists: true, $ne: '' } },
          { referral_code: { $exists: true, $ne: '' } },
        ],
      })
      .toArray();

    // 2. Fetch checkout sessions with SRID and match session_tokens
    const attributedSessions = await checkoutSessionsCollection
      .find({
        $or: [
          { srid: { $exists: true, $ne: '' } },
          { ambassador_srid: { $exists: true, $ne: '' } },
          { referral_srid: { $exists: true, $ne: '' } },
          { referral_code: { $exists: true, $ne: '' } },
        ],
      })
      .toArray();

    const sessionSridMap = new Map<string, string>();
    for (const sess of attributedSessions) {
      const sridVal = sess.srid || sess.ambassador_srid || sess.referral_srid || sess.referral_code;
      if (sess.session_token && sridVal) {
        sessionSridMap.set(String(sess.session_token).trim(), String(sridVal).trim().toUpperCase());
      }
    }

    // Combine any payments that have session_tokens from attributed checkout sessions
    if (sessionSridMap.size > 0) {
      const sessionTokens = Array.from(sessionSridMap.keys());
      const sessionPayments = await paymentsCollection
        .find({ session_token: { $in: sessionTokens } })
        .toArray();

      for (const sp of sessionPayments) {
        const found = attributedPayments.some((p) => p.payment_id === sp.payment_id);
        if (!found) {
          sp.srid = sessionSridMap.get(sp.session_token);
          attributedPayments.push(sp);
        }
      }
    }

    let syncedCount = 0;
    let updatedCount = 0;

    // 3. Process each attributed payment
    for (const p of attributedPayments) {
      const rawSrid =
        p.srid ||
        p.ambassador_srid ||
        p.referral_srid ||
        p.referral_code ||
        (p.session_token ? sessionSridMap.get(p.session_token) : null);

      if (!rawSrid) continue;
      const cleanSrid = String(rawSrid).trim().toUpperCase();

      const ambassador = await Ambassador.findOne({ srid: cleanSrid });
      if (!ambassador) {
        continue;
      }

      const orderId = String(p.session_token || p.payment_id || p._id).trim();
      const paymentId = String(p.payment_id || p._id).trim();

      const existingSale = await CourseSale.findOne({
        $or: [{ orderId }, { paymentId }],
      });

      // Determine payment status
      const pStatus = (p.status || '').toLowerCase();
      let paymentStatus: 'paid' | 'pending' | 'refunded' | 'cancelled' = 'pending';
      if (pStatus === 'approved' || pStatus === 'paid' || pStatus === 'success') {
        paymentStatus = 'paid';
      } else if (pStatus === 'rejected' || pStatus === 'failed') {
        paymentStatus = 'cancelled';
      } else if (pStatus === 'refunded') {
        paymentStatus = 'refunded';
      }

      if (!existingSale) {
        // Calculate commission (default 20%)
        let commissionRate = 20;
        const setting = await CommissionSetting.findOne().sort({ createdAt: -1 });
        if (setting) {
          const specific = setting.courseSpecificRates.find(
            (c) => c.courseId === String(p.item_id)
          );
          commissionRate = specific ? specific.ratePercent : setting.defaultRatePercent;
        }

        const coursePrice = Number(p.amount) || 0;
        const commissionAmount =
          Math.round(((coursePrice * commissionRate) / 100) * 100) / 100;

        const sale = await CourseSale.create({
          orderId,
          paymentId,
          courseId: String(p.item_id || 'course-item'),
          courseName: String(p.item_title || 'SkillRock Course'),
          coursePrice,
          ambassadorId: ambassador._id,
          srid: cleanSrid,
          ambassadorName: ambassador.name,
          paymentStatus,
          commissionRate,
          commissionAmount,
          commissionStatus: paymentStatus === 'paid' ? 'approved' : 'eligible',
          buyerName: p.user_name || '',
          buyerEmail: p.user_email || '',
          saleTimestamp: p.submitted_at || p.created_at || new Date(),
        });

        // Award 50 bonus referral points if paid
        if (paymentStatus === 'paid') {
          await awardOrDeductPoints({
            ambassadorId: ambassador._id,
            amount: 50,
            type: 'referral_sale',
            reason: `Course Sale Referral: ${sale.courseName} (Order #${orderId})`,
            relatedSaleId: sale._id,
          });
        }

        syncedCount++;
      } else {
        // Update existing sale if status changed
        if (existingSale.paymentStatus !== paymentStatus) {
          const wasPaid = existingSale.paymentStatus === 'paid';
          existingSale.paymentStatus = paymentStatus;
          existingSale.commissionStatus =
            paymentStatus === 'paid' ? 'approved' : paymentStatus === 'cancelled' ? 'void' : 'eligible';
          await existingSale.save();

          if (paymentStatus === 'paid' && !wasPaid) {
            await awardOrDeductPoints({
              ambassadorId: ambassador._id,
              amount: 50,
              type: 'referral_sale',
              reason: `Course Sale Referral Verified: ${existingSale.courseName} (Order #${orderId})`,
              relatedSaleId: existingSale._id,
            });
          }
          updatedCount++;
        }
      }
    }

    return { syncedCount, updatedCount, totalProcessed: attributedPayments.length };
  } catch (error: any) {
    console.error('[SkillRock Payments Sync Error]:', error.message);
    return { syncedCount: 0, updatedCount: 0, error: error.message };
  }
};
