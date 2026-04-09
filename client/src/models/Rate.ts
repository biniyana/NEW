import { Rate, InsertRate, insertRateSchema, StaticRate } from '@shared/schema';

export type { Rate, InsertRate, StaticRate };
export { insertRateSchema };

/**
 * Rate Model - Represents market rates for recyclable materials
 */
export class RateModel {
  /**
   * Validates rate data against the schema
   */
  static validate(data: unknown): data is InsertRate {
    try {
      insertRateSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Filter rates by category
   */
  static filterByCategory(rates: Rate[], category: string): Rate[] {
    return rates.filter(rate => rate.category === category);
  }

  /**
   * Filter rates by material
   */
  static filterByMaterial(rates: Rate[], material: string): Rate[] {
    return rates.filter(rate => rate.material === material);
  }

  /**
   * Filter rates by seller
   */
  static filterBySeller(rates: Rate[], sellerId: string): Rate[] {
    return rates.filter(rate => rate.sellerId === sellerId);
  }

  /**
   * Get rate by material
   */
  static getByMaterial(rates: Rate[], material: string): Rate | undefined {
    return rates.find(rate => rate.material === material);
  }

  /**
   * Convert price string to number
   */
  static parsePrice(price: string): number {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Format price for display
   */
  static formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0' : numPrice.toString();
  }

  /**
   * Sort rates by price descending
   */
  static sortByPriceDesc(rates: Rate[]): Rate[] {
    return [...rates].sort((a, b) => RateModel.parsePrice(b.price) - RateModel.parsePrice(a.price));
  }

  /**
   * Sort rates by price ascending
   */
  static sortByPriceAsc(rates: Rate[]): Rate[] {
    return [...rates].sort((a, b) => RateModel.parsePrice(a.price) - RateModel.parsePrice(b.price));
  }
}
