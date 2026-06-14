interface ParticipantInput {
  memberId: string;
  shareValue: number; // percentage, exact, shares, etc.
}

interface SplitResult {
  memberId: string;
  shareValue: number;
  calculatedShare: number;
}

export function calculateSplits(
  amount: number,
  splitType: string,
  participants: ParticipantInput[]
): { valid: boolean; error?: string; splits: SplitResult[] } {
  if (participants.length === 0) {
    return { valid: false, error: 'No participants selected for the expense', splits: [] };
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const numParticipants = participants.length;
  const results: SplitResult[] = [];

  switch (splitType.toUpperCase()) {
    case 'EQUAL': {
      // Split equally. Handle rounding by putting the remainder in the first participant's share.
      const baseShare = Math.floor((roundedAmount / numParticipants) * 100) / 100;
      let sum = 0;

      for (let i = 0; i < numParticipants; i++) {
        results.push({
          memberId: participants[i].memberId,
          shareValue: 100 / numParticipants,
          calculatedShare: baseShare
        });
        sum += baseShare;
      }

      // Distribute remaining cents
      let remainder = Math.round((roundedAmount - sum) * 100) / 100;
      if (remainder !== 0) {
        // Adjust the first participant's share
        results[0].calculatedShare = Math.round((results[0].calculatedShare + remainder) * 100) / 100;
      }
      break;
    }

    case 'PERCENTAGE': {
      // Split by percentage. Sum of percentages must equal 100.
      let pctSum = 0;
      let calculatedSum = 0;

      for (const p of participants) {
        pctSum += p.shareValue;
        const share = Math.round((roundedAmount * (p.shareValue / 100)) * 100) / 100;
        results.push({
          memberId: p.memberId,
          shareValue: p.shareValue,
          calculatedShare: share
        });
        calculatedSum += share;
      }

      if (Math.abs(pctSum - 100) > 0.01) {
        return { valid: false, error: `Percentages must sum to 100%. Current sum: ${pctSum}%`, splits: [] };
      }

      // Adjust rounding mismatch
      const remainder = Math.round((roundedAmount - calculatedSum) * 100) / 100;
      if (remainder !== 0 && results.length > 0) {
        results[0].calculatedShare = Math.round((results[0].calculatedShare + remainder) * 100) / 100;
      }
      break;
    }

    case 'EXACT':
    case 'CUSTOM': {
      // Split by exact amounts. Sum of exact amounts must equal total amount.
      let exactSum = 0;

      for (const p of participants) {
        exactSum += p.shareValue;
        results.push({
          memberId: p.memberId,
          shareValue: p.shareValue,
          calculatedShare: Math.round(p.shareValue * 100) / 100
        });
      }

      if (Math.abs(exactSum - roundedAmount) > 0.01) {
        return {
          valid: false,
          error: `Sum of split amounts (${exactSum}) must equal total expense amount (${roundedAmount})`,
          splits: []
        };
      }
      break;
    }

    case 'SHARES': {
      // Split by shares.
      let totalShares = 0;
      for (const p of participants) {
        totalShares += p.shareValue;
      }

      if (totalShares <= 0) {
        return { valid: false, error: 'Total shares must be greater than 0', splits: [] };
      }

      let calculatedSum = 0;
      for (const p of participants) {
        const share = Math.round((roundedAmount * (p.shareValue / totalShares)) * 100) / 100;
        results.push({
          memberId: p.memberId,
          shareValue: p.shareValue,
          calculatedShare: share
        });
        calculatedSum += share;
      }

      // Adjust rounding mismatch
      const remainder = Math.round((roundedAmount - calculatedSum) * 100) / 100;
      if (remainder !== 0 && results.length > 0) {
        results[0].calculatedShare = Math.round((results[0].calculatedShare + remainder) * 100) / 100;
      }
      break;
    }

    default:
      return { valid: false, error: `Invalid split type: ${splitType}`, splits: [] };
  }

  return { valid: true, splits: results };
}
