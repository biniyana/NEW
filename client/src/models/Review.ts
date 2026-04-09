import { Review, InsertReview, insertReviewSchema } from '@shared/schema';

export type { Review, InsertReview };
export { insertReviewSchema };

/**
 * Review Model - Represents a review/rating for a user
 */
export class ReviewModel {
  /**
   * Validates review data against the schema
   */
  static validate(data: unknown): data is InsertReview {
    try {
      insertReviewSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate average rating from reviews
   */
  static getAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  /**
   * Filter reviews by target user
   */
  static filterByTarget(reviews: Review[], targetId: string): Review[] {
    return reviews.filter(review => review.targetId === targetId);
  }

  /**
   * Filter reviews by reviewer
   */
  static filterByReviewer(reviews: Review[], reviewerId: string): Review[] {
    return reviews.filter(review => review.reviewerId === reviewerId);
  }

  /**
   * Get reviews by rating
   */
  static filterByRating(reviews: Review[], rating: number): Review[] {
    return reviews.filter(review => review.rating === rating);
  }

  /**
   * Get reviews with minimum rating
   */
  static filterByMinRating(reviews: Review[], minRating: number): Review[] {
    return reviews.filter(review => review.rating >= minRating);
  }

  /**
   * Validate rating is between 1 and 5
   */
  static isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 5;
  }
}
