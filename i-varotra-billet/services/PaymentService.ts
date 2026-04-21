import db from '../database/database';

/**
 * Represents a payment record in the system.
 */
export interface Payment {
  id?: number;
  ticket_id: number;
  amount: number;
  payment_date?: string;
  created_at?: string;
}

/**
 * Service handling ticket payment operations.
 */
export const PaymentService = {
  /**
   * Adds a new payment record for a ticket.
   * @param {number} ticketId - Ticket ID.
   * @param {number} amount - Amount paid.
   * @returns {number | null} ID of the payment record.
   */
  addPayment: (ticketId: number, amount: number): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO payments (ticket_id, amount) VALUES (?, ?)`,
        ticketId,
        amount
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding payment', error);
      return null;
    }
  },

  /**
   * Retrieves all payments for a specific ticket.
   * @param {number} ticketId - Ticket ID.
   * @returns {Payment[]} List of payments.
   */
  getPaymentsByTicket: (ticketId: number): Payment[] => {
    try {
      return db.getAllSync(
        `SELECT * FROM payments WHERE ticket_id = ? ORDER BY payment_date DESC`,
        ticketId
      );
    } catch (error) {
      console.error('Error fetching payments', error);
      return [];
    }
  },

  /**
   * Calculates the total amount paid for a specific ticket.
   * @param {number} ticketId - Ticket ID.
   * @returns {number} Sum of all payments.
   */
  getTotalPaidForTicket: (ticketId: number): number => {
    try {
      const result: any = db.getFirstSync(
        `SELECT SUM(amount) as total FROM payments WHERE ticket_id = ?`,
        ticketId
      );
      return result ? result.total || 0 : 0;
    } catch (error) {
      console.error('Error calculating total paid', error);
      return 0;
    }
  }
};
