import { Item, InsertItem, insertItemSchema } from '@shared/schema';

export type { Item, InsertItem };
export { insertItemSchema };

/**
 * Item Model - Represents a recyclable item listing in the marketplace
 */
export class ItemModel {
  /**
   * Validates item data against the schema
   */
  static validate(data: unknown): data is InsertItem {
    try {
      insertItemSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if item is available for purchase
   */
  static isAvailable(item: Item): boolean {
    return item.status === 'available';
  }

  /**
   * Check if item is sold
   */
  static isSold(item: Item): boolean {
    return item.status === 'sold';
  }

  /**
   * Check if item is pending
   */
  static isPending(item: Item): boolean {
    return item.status === 'pending';
  }

  /**
   * Filter items by seller
   */
  static filterBySeller(items: Item[], sellerId: string): Item[] {
    return items.filter(item => item.sellerId === sellerId);
  }

  /**
   * Filter items by category
   */
  static filterByCategory(items: Item[], category: string): Item[] {
    return items.filter(item => item.category === category);
  }

  /**
   * Filter items by status
   */
  static filterByStatus(items: Item[], status: string): Item[] {
    return items.filter(item => item.status === status);
  }

  /**
   * Get items from parsed data
   */
  static parseFromData(data: any[]): Item[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      price: item.price,
      description: item.description || null,
      imageUrl: item.imageUrl || null,
      imageUrls: item.imageUrls || null,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      emoji: item.emoji || null,
      status: item.status || 'available',
      createdAt: item.createdAt ? new Date(item.createdAt) : null,
    }));
  }
}
