import { Request } from '@/models';

/**
 * Request Controller - Handles collection and purchase requests
 */
export class RequestController {
  /**
   * Fetch all requests
   */
  static async fetchAllRequests(): Promise<Request[]> {
    try {
      const res = await fetch('/api/requests', { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
    return [];
  }

  /**
   * Fetch requests by requester ID
   */
  static async fetchRequestsByRequester(requesterId: string): Promise<Request[]> {
    try {
      const res = await fetch(`/api/requests/requester/${requesterId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch requests by requester:', err);
    }
    return [];
  }

  /**
   * Fetch requests by responder ID
   */
  static async fetchRequestsByResponder(responderId: string): Promise<Request[]> {
    try {
      const res = await fetch(`/api/requests/responder/${responderId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch requests by responder:', err);
    }
    return [];
  }

  /**
   * Fetch request by ID
   */
  static async fetchRequestById(requestId: string): Promise<Request | null> {
    try {
      const res = await fetch(`/api/requests/${requestId}`, { credentials: 'include' });
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      console.error('Failed to fetch request:', err);
    }
    return null;
  }

  /**
   * Create new request
   */
  static async createRequest(requestData: any): Promise<Request> {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed to create request');
    } catch (err) {
      console.error('Failed to create request:', err);
      throw err;
    }
  }

  /**
   * Update request
   */
  static async updateRequest(requestId: string, requestData: Partial<Request>): Promise<void> {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to update request');
      }
    } catch (err) {
      console.error('Failed to update request:', err);
      throw err;
    }
  }

  /**
   * Update request status
   */
  static async updateRequestStatus(
    requestId: string,
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled'
  ): Promise<void> {
    await this.updateRequest(requestId, { status });
  }

  /**
   * Accept request
   */
  static async acceptRequest(requestId: string, responderId: string, responderName: string): Promise<void> {
    await this.updateRequest(requestId, {
      status: 'Accepted',
      responderId,
      responderName,
    });
  }

  /**
   * Reject request
   */
  static async rejectRequest(requestId: string): Promise<void> {
    await this.updateRequestStatus(requestId, 'Cancelled');
  }

  /**
   * Complete request
   */
  static async completeRequest(requestId: string): Promise<void> {
    await this.updateRequestStatus(requestId, 'Completed');
  }

  /**
   * Delete request
   */
  static async deleteRequest(requestId: string): Promise<void> {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to delete request');
      }
    } catch (err) {
      console.error('Failed to delete request:', err);
      throw err;
    }
  }
}
