import { ref, get, set, update, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '@/firebase/firebase';
import { Item } from '@/models';

/**
 * Item Controller - Handles marketplace item operations
 */
export class ItemController {
  /**
   * Fetch all items from Firebase
   */
  static async fetchAllItems(): Promise<Item[]> {
    try {
      const res = await fetch('/api/items', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
    return [];
  }

  /**
   * Fetch items by seller ID
   */
  static async fetchItemsBySeller(sellerId: string): Promise<Item[]> {
    try {
      const res = await fetch(`/api/items/seller/${sellerId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch items by seller:', err);
    }
    return [];
  }

  /**
   * Subscribe to items for seller
   */
  static onSellerItems(sellerId: string, callback: (items: Item[]) => void): () => void {
    const itemsRef = ref(database, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsList: Item[] = (Object.values(data) as Item[]).filter((item: any) => item.sellerId === sellerId);
        callback(itemsList);
      } else {
        callback([]);
      }
    });
    return unsubscribe;
  }

  /**
   * Fetch item by ID
   */
  static async fetchItemById(itemId: string): Promise<Item | null> {
    try {
      const res = await fetch(`/api/items/${itemId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch item:', err);
    }
    return null;
  }

  /**
   * Create new item
   */
  static async createItem(itemData: any): Promise<Item> {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to create item');
    } catch (err) {
      console.error('Failed to create item:', err);
      throw err;
    }
  }

  /**
   * Update item
   */
  static async updateItem(itemId: string, itemData: Partial<Item>): Promise<void> {
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to update item');
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      throw err;
    }
  }

  /**
   * Delete item
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw err;
    }
  }

  /**
   * Update item status
   */
  static async updateItemStatus(itemId: string, status: 'available' | 'sold' | 'pending'): Promise<void> {
    await this.updateItem(itemId, { status });
  }

  /**
   * Search items by query
   */
  static async searchItems(query: string): Promise<Item[]> {
    try {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to search items:', err);
    }
    return [];
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(category: string): Promise<Item[]> {
    try {
      const res = await fetch(`/api/items/category/${category}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch items by category:', err);
    }
    return [];
  }
}
