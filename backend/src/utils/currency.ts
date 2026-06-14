import prisma from '../config/prisma';

// Static fallback rates if the database doesn't have them
const DEFAULT_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.0, INR: 83.5, EUR: 0.93 },
  INR: { USD: 0.012, INR: 1.0, EUR: 0.011 },
  EUR: { USD: 1.08, INR: 90.0, EUR: 1.0 }
};

export class CurrencyService {
  /**
   * Retrieves the exchange rate from -> to.
   * Checks database first, falls back to default rates if not found.
   */
  static async getRate(from: string, to: string): Promise<number> {
    const cleanFrom = from.toUpperCase();
    const cleanTo = to.toUpperCase();

    if (cleanFrom === cleanTo) return 1.0;

    try {
      // Try fetching from database
      const rateRecord = await prisma.exchangeRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: cleanFrom,
            toCurrency: cleanTo
          }
        }
      });

      if (rateRecord) {
        return rateRecord.rate;
      }
    } catch (error) {
      console.warn(`Prisma error fetching exchange rate ${cleanFrom}->${cleanTo}:`, error);
    }

    // Fallback rate
    const fromRates = DEFAULT_RATES[cleanFrom];
    if (fromRates && fromRates[cleanTo]) {
      return fromRates[cleanTo];
    }

    // If reverse rate exists, calculate inverse
    const reverseRates = DEFAULT_RATES[cleanTo];
    if (reverseRates && reverseRates[cleanFrom]) {
      return 1 / reverseRates[cleanFrom];
    }

    return 1.0; // Default fallback if currency is unrecognised
  }

  /**
   * Converts an amount from one currency to another
   */
  static async convert(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getRate(from, to);
    return Math.round(amount * rate * 100) / 100;
  }
}
