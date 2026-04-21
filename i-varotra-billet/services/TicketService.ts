import db from '../database/database';
import { BuyerService } from './BuyerService';

/**
 * Represents a ticket in the system.
 */
export interface Ticket {
  id?: number;
  event_id: number;
  ticket_type_id?: number;
  ticket_type_name?: string;
  ticket_number: string;
  qr_code: string;
  price: number;
  status_id?: number;
  status_name?: string;
  buyer_id?: number;
  buyer_name?: string;
  buyer_phone?: string;
  total_paid?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service handling ticket-related operations including generation and assignment.
 */
export const TicketService = {
  STATUS_DISPONIBLE: 1,
  STATUS_VENDU: 2,
  STATUS_VALIDE: 3,

  /**
   * Generates a specified number of tickets for an event.
   * @param {number} eventId - The ID of the event.
   * @param {number} count - How many tickets to create.
   * @param {number} price - Base price for each ticket.
   * @param {number} ticketTypeId - (Optional) The ID of the ticket type.
   * @returns {boolean} True if generation was successful.
   */
  generateTickets: (eventId: number, count: number, price: number, ticketTypeId?: number): boolean => {
    try {
      const stats: any = db.getFirstSync(`SELECT COUNT(*) as total FROM tickets WHERE event_id = ?`, eventId);
      const startCount = stats ? stats.total + 1 : 1;
      for (let i = 0; i < count; i++) {
        const ticketNum = `E${eventId}-T${(startCount + i).toString().padStart(4, '0')}`;
        db.runSync(`INSERT INTO tickets (event_id, ticket_number, qr_code, price, status_id, ticket_type_id) VALUES (?, ?, ?, ?, ?, ?)`,
          eventId, ticketNum, ticketNum, price, TicketService.STATUS_DISPONIBLE, ticketTypeId || null);
      }
      return true;
    } catch (error) { return false; }
  },

  /**
   * Retrieves all tickets associated with a specific event.
   * Includes details about the buyer and payment status.
   * @param {number} eventId - The ID of the event.
   * @returns {Ticket[]} List of tickets.
   */
  getTicketsByEvent: (eventId: number): Ticket[] => {
    try {
      // First check if tickets exist
      const simpleTickets = db.getAllSync(
        `SELECT id, event_id, ticket_number, qr_code, price, status_id, buyer_id, ticket_type_id
         FROM tickets
         WHERE event_id = ? ORDER BY ticket_number ASC`,
        eventId
      );
      
      if (!simpleTickets || simpleTickets.length === 0) {
        return [];
      }
      
      // Now get full details with JOINs
      const tickets = db.getAllSync(
        `SELECT t.id, t.event_id, t.ticket_number, t.qr_code, t.price, t.status_id, t.buyer_id, t.ticket_type_id,
         s.name as status_name, b.name as buyer_name, b.phone as buyer_phone,
         tt.name as ticket_type_name,
         (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
         WHERE t.event_id = ? ORDER BY t.ticket_number ASC`,
        eventId
      );
      
      return tickets || simpleTickets;
    } catch (error) { 
      console.error('getTicketsByEvent error:', error);
      return []; 
    }
  },

  /**
   * Retrieves a single ticket by its ID.
   * @param {number} id - Unique identifier of the ticket.
   * @returns {Ticket | null} The ticket object or null.
   */
  getTicketById: (id: number): Ticket | null => {
    try {
      return db.getFirstSync(
        `SELECT t.*, s.name as status_name, b.name as buyer_name, b.phone as buyer_phone,
         tt.name as ticket_type_name,
         (SELECT SUM(amount) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
         WHERE t.id = ?`,
        id
      );
    } catch (error) { return null; }
  },

  /**
   * Assigns a ticket to a buyer and records a payment.
   * @param {number} ticketId - ID of the ticket to assign.
   * @param {string} buyerName - Name of the buyer.
   * @param {string} buyerPhone - Phone number of the buyer.
   * @param {number} amount - Initial payment amount.
   * @returns {boolean} Success status.
   */
  assignTicket: (ticketId: number, buyerName: string, buyerPhone: string, amount: number): boolean => {
    try {
      const buyerId = BuyerService.addBuyer({ name: buyerName, phone: buyerPhone });
      if (!buyerId) return false;

      db.runSync(
        `UPDATE tickets SET buyer_id = ?, status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        buyerId,
        TicketService.STATUS_VENDU,
        ticketId
      );

      if (amount > 0) {
        db.runSync(`INSERT INTO payments (ticket_id, amount) VALUES (?, ?)`, ticketId, amount);
      }
      return true;
    } catch (error) { return false; }
  },

  /**
   * Updates multiple tickets at once for the same buyer.
   * @param {object} data - Batch data containing buyer info and ticket list.
   * @returns {boolean} Success status.
   */
  updateTicketsBatch: (data: { 
    buyer_name: string, 
    buyer_phone: string, 
    items: { id: number, amount: number }[] 
  }): boolean => {
    try {
      const buyerId = BuyerService.addBuyer({ name: data.buyer_name, phone: data.buyer_phone });
      if (!buyerId) return false;

      for (const item of data.items) {
        TicketService.assignTicket(item.id, data.buyer_name, data.buyer_phone, item.amount);
      }
      return true;
    } catch (error) { return false; }
  },

  /**
   * Updates the status of a specific ticket.
   * @param {number} id - Ticket ID.
   * @param {number} statusId - New status ID.
   * @returns {boolean} Success status.
   */
  updateStatus: (id: number, statusId: number): boolean => {
    try {
      db.runSync(`UPDATE tickets SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, statusId, id);
      return true;
    } catch (error) { return false; }
  },

  /**
   * Deletes all payment records for a ticket.
   * @param {number} ticketId - Ticket ID.
   * @returns {boolean} Success status.
   */
  cancelPayments: (ticketId: number): boolean => {
    try {
      db.runSync(`DELETE FROM payments WHERE ticket_id = ?`, ticketId);
      return true;
    } catch (error) { return false; }
  },

  /**
   * Resets a ticket's verification status back to "Sold" and removes attendance record.
   * @param {number} ticketId - Ticket ID.
   * @returns {boolean} Success status.
   */
  resetTicketVerification: (ticketId: number): boolean => {
    try {
      db.runSync(
        `UPDATE tickets SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        TicketService.STATUS_VENDU,
        ticketId
      );
      db.runSync(`DELETE FROM attendance WHERE ticket_id = ?`, ticketId);
      return true;
    } catch (error) { return false; }
  },

  /**
   * Resets verification for multiple tickets.
   * @param {number[]} ticketIds - Array of ticket IDs.
   * @returns {boolean} Success status.
   */
  resetTicketsVerificationBatch: (ticketIds: number[]): boolean => {
    try {
      const placeholders = ticketIds.map(() => '?').join(',');
      db.runSync(
        `UPDATE tickets SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        TicketService.STATUS_VENDU,
        ...ticketIds
      );
      db.runSync(`DELETE FROM attendance WHERE ticket_id IN (${placeholders})`, ...ticketIds);
      return true;
    } catch (error) { return false; }
  },

  /**
   * Retrieves the last 3 ticket activities (assignments or verifications).
   * @returns {Ticket[]} List of recent ticket activities.
   */
  getRecentActivities: (): any[] => {
    try {
      return db.getAllSync(
        `SELECT t.*, s.name as status_name, b.name as buyer_name, e.name as event_name, tt.name as ticket_type_name
         FROM tickets t
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         LEFT JOIN events e ON t.event_id = e.id
         LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
         WHERE t.status_id IN (${TicketService.STATUS_VENDU}, ${TicketService.STATUS_VALIDE})
         ORDER BY t.updated_at DESC LIMIT 10`
      );
    } catch (error) { return []; }
  },

  /**
   * Calculates comprehensive statistics for an event including financials.
   * @param {number} eventId - ID of the event.
   * @returns {object} Object containing counts and revenue data.
   */
  getEventStats: (eventId: number) => {
    try {
      const counts: any = db.getFirstSync(
        `SELECT COUNT(*) as total,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_DISPONIBLE} THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_VENDU} THEN 1 ELSE 0 END) as sold,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_VALIDE} THEN 1 ELSE 0 END) as validated,
          SUM(CASE WHEN status_id IN (${TicketService.STATUS_VENDU}, ${TicketService.STATUS_VALIDE}) THEN price ELSE 0 END) as total_potential_revenue
         FROM tickets WHERE event_id = ?`,
        eventId
      );

      const payments: any = db.getFirstSync(
        `SELECT SUM(p.amount) as total_collected
         FROM payments p
         JOIN tickets t ON p.ticket_id = t.id
         WHERE t.event_id = ? AND t.status_id IN (${TicketService.STATUS_VENDU}, ${TicketService.STATUS_VALIDE})`,
        eventId
      );

      return {
        ...(counts || { total: 0, available: 0, sold: 0, validated: 0, total_potential_revenue: 0 }),
        total_collected: payments?.total_collected || 0,
        total_pending: (counts?.total_potential_revenue || 0) - (payments?.total_collected || 0)
      };
    } catch (error) {
      console.error('getEventStats error:', error);
      return { total: 0, available: 0, sold: 0, validated: 0, total_potential_revenue: 0, total_collected: 0, total_pending: 0 };
    }
  }
};
