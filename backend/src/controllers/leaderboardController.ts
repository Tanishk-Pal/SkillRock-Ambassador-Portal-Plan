import { Request, Response } from 'express';
import { Ambassador } from '../models/Ambassador';

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';

    const filter: any = { status: 'active' };
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { college: regex }, { srid: regex }, { city: regex }];
    }

    const ambassadors = await Ambassador.find(filter)
      .sort({ totalPoints: -1, createdAt: 1 })
      .select('srid name college city avatar totalPoints currentRank badgeTier badges')
      .lean();

    // Re-assign dynamic ranks for current filtered view
    const rankedList = ambassadors.map((amb, index) => ({
      ...amb,
      rank: index + 1,
    }));

    const topThree = rankedList.slice(0, 3);
    const tableList = rankedList.slice(3);

    return res.json({
      success: true,
      totalCount: rankedList.length,
      topThree,
      rankings: tableList,
      fullList: rankedList,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
