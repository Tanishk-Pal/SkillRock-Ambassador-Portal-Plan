import { Request, Response } from 'express';
import { Ambassador } from '../models/Ambassador';
import { processCourseSale } from '../services/salesService';

export const validateSRID = async (req: Request, res: Response) => {
  try {
    const { srid } = req.params;
    if (!srid) {
      return res.status(400).json({ success: false, valid: false, message: 'SRID is required.' });
    }

    const cleanSrid = srid.trim().toUpperCase();
    const ambassador = await Ambassador.findOne({ srid: cleanSrid, status: 'active' }).select('name srid college');

    if (!ambassador) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `SRID '${cleanSrid}' is not recognized or is inactive.`,
      });
    }

    return res.json({
      success: true,
      valid: true,
      ambassador: {
        srid: ambassador.srid,
        name: ambassador.name,
        college: ambassador.college,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, valid: false, message: error.message });
  }
};

export const recordSaleWebhook = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, courseId, courseName, coursePrice, srid, paymentStatus, buyerName, buyerEmail } = req.body;

    if (!orderId || !paymentId || !courseName || coursePrice === undefined || !srid) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory fields: orderId, paymentId, courseName, coursePrice, and srid are required.',
      });
    }

    const result = await processCourseSale({
      orderId: String(orderId).trim(),
      paymentId: String(paymentId).trim(),
      courseId: String(courseId || 'course-default').trim(),
      courseName: String(courseName).trim(),
      coursePrice: Number(coursePrice),
      srid: String(srid).trim(),
      paymentStatus: paymentStatus || 'paid',
      buyerName,
      buyerEmail,
    });

    return res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Sale successfully attributed to ambassador.' : 'Sale was previously recorded.',
      sale: result.sale,
    });
  } catch (error: any) {
    console.error('Record sale error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
