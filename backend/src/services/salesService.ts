import { CourseSale } from '../models/CourseSale';
import { Ambassador } from '../models/Ambassador';
import { CommissionSetting } from '../models/CommissionSetting';
import { awardOrDeductPoints } from './pointsService';

export interface RecordSaleParams {
  orderId: string;
  paymentId: string;
  courseId: string;
  courseName: string;
  coursePrice: number;
  srid: string;
  paymentStatus?: 'paid' | 'pending' | 'refunded' | 'cancelled';
  buyerName?: string;
  buyerEmail?: string;
  saleTimestamp?: Date;
}

export const processCourseSale = async (params: RecordSaleParams) => {
  const cleanSrid = (params.srid || '').trim().toUpperCase();

  // 1. Verify ambassador with SRID exists
  const ambassador = await Ambassador.findOne({ srid: cleanSrid });
  if (!ambassador) {
    throw new Error(`Invalid SRID: ${cleanSrid}. Sale cannot be attributed.`);
  }

  // 2. Prevent duplicate order/payment records (Idempotency)
  const existingSale = await CourseSale.findOne({
    $or: [{ orderId: params.orderId }, { paymentId: params.paymentId }],
  });

  if (existingSale) {
    return { sale: existingSale, isNew: false };
  }

  // 3. Determine commission rate
  let commissionRate = 20; // default 20%
  const setting = await CommissionSetting.findOne().sort({ createdAt: -1 });
  if (setting) {
    const specific = setting.courseSpecificRates.find((c) => c.courseId === params.courseId);
    commissionRate = specific ? specific.ratePercent : setting.defaultRatePercent;
  }

  const commissionAmount = Math.round(((params.coursePrice * commissionRate) / 100) * 100) / 100;
  const paymentStatus = params.paymentStatus || 'paid';

  // 4. Create sale attribution
  const sale = await CourseSale.create({
    orderId: params.orderId,
    paymentId: params.paymentId,
    courseId: params.courseId,
    courseName: params.courseName,
    coursePrice: params.coursePrice,
    ambassadorId: ambassador._id,
    srid: cleanSrid,
    ambassadorName: ambassador.name,
    paymentStatus,
    commissionRate,
    commissionAmount,
    commissionStatus: paymentStatus === 'paid' ? 'approved' : 'eligible',
    buyerName: params.buyerName || '',
    buyerEmail: params.buyerEmail || '',
    saleTimestamp: params.saleTimestamp || new Date(),
  });

  // 5. Award 50 bonus referral points for successful paid course enrollment
  if (paymentStatus === 'paid') {
    await awardOrDeductPoints({
      ambassadorId: ambassador._id,
      amount: 50,
      type: 'referral_sale',
      reason: `Course Sale Referral: ${params.courseName} (Order #${params.orderId})`,
      relatedSaleId: sale._id,
    });
  }

  return { sale, isNew: true };
};
