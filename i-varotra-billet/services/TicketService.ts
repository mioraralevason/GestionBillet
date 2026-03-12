import db from '../database/database';
import { BuyerService } from './BuyerService';

export interface Ticket {
  id?: number;
  event_id: number;
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

export const TicketService = {
  STATUS_DISPONIBLE: 1,
  STATUS_VENDU: 2,
  STATUS_VALIDE: 3,

  generateTickets: (eventId: number, count: number, price: number): boolean => {
    try {
      const stats: any = db.getFirstSync(`SELECT COUNT(*) as total FROM tickets WHERE event_id = ?`, eventId);
      const startCount = stats ? stats.total + 1 : 1;
      for (let i = 0; i < count; i++) {
        const ticketNum = `E${eventId}-T${(startCount + i).toString().padStart(4, '0')}`;
        db.runSync(`INSERT INTO tickets (event_id, ticket_number, qr_code, price, status_id) VALUES (?, ?, ?, ?, ?)`,
          eventId, ticketNum, ticketNum, price, TicketService.STATUS_DISPONIBLE);
      }
      return true;
    } catch (error) { return false; }
  },

  getTicketsByEvent: (eventId: number): Ticket[] => {
    try {
      return db.getAllSync(
        `SELECT t.*, s.name as status_name, b.name as buyer_name, b.phone as buyer_phone,
         (SELECT SUM(amount) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         WHERE t.event_id = ? ORDER BY t.ticket_number ASC`,
        eventId
      );
    } catch (error) { return []; }
  },

  getTicketById: (id: number): Ticket | null => {
    try {
      return db.getFirstSync(
        `SELECT t.*, s.name as status_name, b.name as buyer_name, b.phone as buyer_phone,
         (SELECT SUM(amount) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         WHERE t.id = ?`,
        id
      );
    } catch (error) { return null; }
  },

  assignTicket: (ticketId: number, buyerName: string, buyerPhone: string, amount: number): boolean => {
    try {
      // 1. Gérer l'acheteur unique
      const buyerId = BuyerService.addBuyer({ name: buyerName, phone: buyerPhone });
      if (!buyerId) return false;

      // 2. Lier le ticket à cet acheteur
      db.runSync(
        `UPDATE tickets SET buyer_id = ?, status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        buyerId,
        TicketService.STATUS_VENDU,
        ticketId
      );

      // 3. Ajouter le paiement
      if (amount > 0) {
        db.runSync(`INSERT INTO payments (ticket_id, amount) VALUES (?, ?)`, ticketId, amount);
      }
      return true;
    } catch (error) { return false; }
  },

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

  updateStatus: (id: number, statusId: number): boolean => {
    try {
      db.runSync(`UPDATE tickets SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, statusId, id);
      return true;
    } catch (error) { return false; }
  },

  cancelPayments: (ticketId: number): boolean => {
    try {
      db.runSync(`DELETE FROM payments WHERE ticket_id = ?`, ticketId);
      return true;
    } catch (error) { return false; }
  },

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

  getEventStats: (eventId: number) => {
    try {
      const row: any = db.getFirstSync(
        `SELECT COUNT(*) as total,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_DISPONIBLE} THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_VENDU} THEN 1 ELSE 0 END) as sold,
          SUM(CASE WHEN status_id = ${TicketService.STATUS_VALIDE} THEN 1 ELSE 0 END) as validated
         FROM tickets WHERE event_id = ?`,
        eventId
      );
      return row || { total: 0, available: 0, sold: 0, validated: 0 };
    } catch (error) { return { total: 0, available: 0, sold: 0, validated: 0 }; }
  }
};
