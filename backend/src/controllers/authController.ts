import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Ambassador } from '../models/Ambassador';
import { Admin } from '../models/Admin';
import { signToken } from '../middleware/auth';

export const ambassadorLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user is an Admin logging in from the unified login page
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = signToken({
        id: admin._id.toString(),
        role: 'admin',
        email: admin.email,
        name: admin.name,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
        },
      });
    }

    // 2. Check Ambassador accounts
    const ambassador = await Ambassador.findOne({ email: cleanEmail });

    if (!ambassador) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (ambassador.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your ambassador account has been suspended. Please contact SkillRock support.' });
    }

    if (!ambassador.passwordHash) {
      return res.status(400).json({ success: false, message: 'Account not yet activated. Please use the password setup link provided by admin.' });
    }

    const isMatch = await bcrypt.compare(password, ambassador.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken({
      id: ambassador._id.toString(),
      role: 'ambassador',
      email: ambassador.email,
      srid: ambassador.srid,
      name: ambassador.name,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: ambassador._id,
        srid: ambassador.srid,
        name: ambassador.name,
        email: ambassador.email,
        college: ambassador.college,
        avatar: ambassador.avatar,
        totalPoints: ambassador.totalPoints,
        currentRank: ambassador.currentRank,
        badgeTier: ambassador.badgeTier,
        role: 'ambassador',
      },
    });
  } catch (error: any) {
    console.error('Ambassador Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = signToken({
      id: admin._id.toString(),
      role: 'admin',
      email: admin.email,
      name: admin.name,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during admin login.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const ambassador = await Ambassador.findOne({ email: email.trim().toLowerCase() });
    if (!ambassador) {
      // Don't disclose account existence for security
      return res.json({ success: true, message: 'If this email exists in our system, password reset instructions have been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    ambassador.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    ambassador.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await ambassador.save();

    return res.json({
      success: true,
      message: 'Password reset token generated successfully.',
      // In development, return token for easy testing
      debugToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const ambassador = await Ambassador.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!ambassador) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    ambassador.passwordHash = await bcrypt.hash(newPassword, 12);
    ambassador.resetPasswordToken = undefined;
    ambassador.resetPasswordExpires = undefined;
    await ambassador.save();

    return res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const role = (req.user.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin' || role.includes('admin');

    if (isAdmin) {
      const admin = await Admin.findById(req.user.id).select('-passwordHash');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin profile not found.' });
      }
      return res.json({
        success: true,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
        },
      });
    }

    const ambassador = await Ambassador.findById(req.user.id).select('-passwordHash');
    if (!ambassador) {
      return res.status(404).json({ success: false, message: 'Ambassador profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        ...ambassador.toObject(),
        role: 'ambassador',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
