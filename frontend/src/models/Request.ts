import { Request, InsertRequest, insertRequestSchema } from '@shared/schema';

export type { Request, InsertRequest };
export { insertRequestSchema };

/**
 * Request Model - Represents a collection or purchase request
 */
export class RequestModel {
  /**
   * Validates request data against the schema
   */
  static validate(data: unknown): data is InsertRequest {
    try {
      insertRequestSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if request is a collection request
   */
  static isCollectionRequest(request: Request): boolean {
    return request.type === 'Collection';
  }

  /**
   * Check if request is a purchase request
   */
  static isPurchaseRequest(request: Request): boolean {
    return request.type === 'Purchase';
  }

  /**
   * Check if request is pending
   */
  static isPending(request: Request): boolean {
    return request.status === 'Pending';
  }

  /**
   * Check if request is accepted
   */
  static isAccepted(request: Request): boolean {
    return request.status === 'Accepted';
  }

  /**
   * Check if request is completed
   */
  static isCompleted(request: Request): boolean {
    return request.status === 'Completed';
  }

  /**
   * Check if request is cancelled
   */
  static isCancelled(request: Request): boolean {
    return request.status === 'Cancelled';
  }

  /**
   * Filter requests by type
   */
  static filterByType(requests: Request[], type: 'Collection' | 'Purchase'): Request[] {
    return requests.filter(req => req.type === type);
  }

  /**
   * Filter requests by status
   */
  static filterByStatus(requests: Request[], status: string): Request[] {
    return requests.filter(req => req.status === status);
  }

  /**
   * Filter requests by requester
   */
  static filterByRequester(requests: Request[], requesterId: string): Request[] {
    return requests.filter(req => req.requesterId === requesterId);
  }

  /**
   * Filter requests by responder
   */
  static filterByResponder(requests: Request[], responderId: string): Request[] {
    return requests.filter(req => req.responderId === responderId);
  }
}
