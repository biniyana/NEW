import { Rate } from '@/models';

/**
 * Rate Controller - Handles market rate operations
 */
export class RateController {
  /**
   * Fetch all rates
   */
  static async fetchAllRates(): Promise<Rate[]> {
    try {
      const res = await fetch('/api/rates', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
    return [];
  }

  /**
   * Fetch rates by category
   */
  static async fetchRatesByCategory(category: string): Promise<Rate[]> {
    try {
      const res = await fetch(`/api/rates/category/${category}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch rates by category:', err);
    }
    return [];
  }

  /**
   * Fetch rates by seller
   */
  static async fetchRatesBySeller(sellerId: string): Promise<Rate[]> {
    try {
      const res = await fetch(`/api/rates/seller/${sellerId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch rates by seller:', err);
    }
    return [];
  }

  /**
   * Fetch rate by ID
   */
  static async fetchRateById(rateId: string): Promise<Rate | null> {
    try {
      const res = await fetch(`/api/rates/${rateId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch rate:', err);
    }
    return null;
  }

  /**
   * Create new rate
   */
  static async createRate(rateData: any): Promise<Rate> {
    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData),
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to create rate');
    } catch (err) {
      console.error('Failed to create rate:', err);
      throw err;
    }
  }

  /**
   * Update rate
   */
  static async updateRate(rateId: string, rateData: Partial<Rate>): Promise<void> {
    try {
      const res = await fetch(`/api/rates/${rateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to update rate');
      }
    } catch (err) {
      console.error('Failed to update rate:', err);
      throw err;
    }
  }

  /**
   * Delete rate
   */
  static async deleteRate(rateId: string): Promise<void> {
    try {
      const res = await fetch(`/api/rates/${rateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to delete rate');
      }
    } catch (err) {
      console.error('Failed to delete rate:', err);
      throw err;
    }
  }

  /**
   * Fetch static rates
   */
  static async fetchStaticRates(): Promise<Rate[]> {
    try {
      const res = await fetch('/api/rates/static', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch static rates:', err);
    }
    return [];
  }
}
