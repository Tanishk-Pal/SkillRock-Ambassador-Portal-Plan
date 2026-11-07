import { Ambassador } from '../models/Ambassador';

export const generateNextSRID = async (): Promise<string> => {
  // Find highest existing SRID with format SRxxxx
  const ambassadors = await Ambassador.find({ srid: /^SR\d+$/i }).select('srid').lean();
  let maxNum = 1000;

  for (const amb of ambassadors) {
    if (amb.srid) {
      const match = amb.srid.match(/^SR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextSRID = `SR${maxNum + 1}`;
  return nextSRID;
};

export const isValidSRID = async (srid: string): Promise<boolean> => {
  if (!srid) return false;
  const count = await Ambassador.countDocuments({ srid: srid.trim().toUpperCase() });
  return count > 0;
};
