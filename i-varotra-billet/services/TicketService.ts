// services/TicketService.ts
import db from '../database/database';

export interface Ticket {
  id?: number;
  event_id: number;
  ticket_number: string;
  qr_data: string;
  price: number;
  status: string; // 'disponible', 'vendu', 'validé'
  buyer_id?: number;
  buyer_name?: string;
  buyer_phone?: string;
  amount_paid?: number;
  created_at?: string;
}

export const TicketService = {
  // Générer X billets pour un événement
  generateTickets: (eventId: number, count: number, price: number): boolean => {
    try {
      // On récupère le nombre de billets déjà existants pour cet événement
      const stats: any = db.getFirstSync(
        `SELECT COUNT(*) as total FROM tickets WHERE event_id = ?`,
        eventId
      );
      const startCount = stats ? stats.total + 1 : 1;

      for (let i = 0; i < count; i++) {
        const ticketNum = `E${eventId}-T${(startCount + i).toString().padStart(4, '0')}`;
        // Les données QR sont simplement le numéro unique du billet
        const qrData = ticketNum;

        db.runSync(
          `INSERT INTO tickets (event_id, ticket_number, qr_data, price, created_at) 
           VALUES (?, ?, ?, ?, datetime('now'))`,
          eventId,
          ticketNum,
          qrData,
          price
        );
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la génération des billets', error);
      return false;
    }
  },

  // Récupérer les billets d'un événement
  getTicketsByEvent: (eventId: number): Ticket[] => {
    try {
      return db.getAllSync(
        `SELECT * FROM tickets WHERE event_id = ? ORDER BY ticket_number ASC`,
        eventId
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des billets', error);
      return [];
    }
  },

  // Récupérer un billet par son ID
  getTicketById: (id: number): Ticket | null => {
    try {
      return db.getFirstSync(`SELECT * FROM tickets WHERE id = ?`, id);
    } catch (error) {
      return null;
    }
  },

  // Mettre à jour un billet (Acheteur, Paiement, Statut)
  updateTicket: (ticket: Ticket): boolean => {
    if (!ticket.id) return false;
    try {
      db.runSync(
        `UPDATE tickets SET 
          status = ?, 
          buyer_id = ?, 
          buyer_name = ?, 
          buyer_phone = ?, 
          amount_paid = ? 
         WHERE id = ?`,
        ticket.status,
        ticket.buyer_id || null,
        ticket.buyer_name || null,
        ticket.buyer_phone || null,
        ticket.amount_paid || 0,
        ticket.id
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du billet', error);
      return false;
    }
  },

  // Mettre à jour plusieurs billets d'un coup
  updateTicketsBatch: (ids: number[], data: Partial<Ticket>): boolean => {
    if (ids.length === 0) return false;
    try {
      const placeholders = ids.map(() => '?').join(',');
      const params = [];
      let query = "UPDATE tickets SET ";
      
      const updates = [];
      if (data.status) { updates.push("status = ?"); params.push(data.status); }
      if (data.buyer_id !== undefined) { updates.push("buyer_id = ?"); params.push(data.buyer_id); }
      if (data.buyer_name !== undefined) { updates.push("buyer_name = ?"); params.push(data.buyer_name); }
      if (data.buyer_phone !== undefined) { updates.push("buyer_phone = ?"); params.push(data.buyer_phone); }
      if (data.amount_paid !== undefined) { updates.push("amount_paid = ?"); params.push(data.amount_paid); }
      
      query += updates.join(", ") + ` WHERE id IN (${placeholders})`;
      params.push(...ids);

      db.runSync(query, ...params);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour groupée', error);
      return false;
    }
  },

  // Statistiques d'un événement
  getEventStats: (eventId: number) => {
    try {
      const row: any = db.getFirstSync(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 'vendu' THEN 1 ELSE 0 END) as sold,
          SUM(CASE WHEN status = 'validé' THEN 1 ELSE 0 END) as validated
         FROM tickets WHERE event_id = ?`,
        eventId
      );
      return row || { total: 0, available: 0, sold: 0, validated: 0 };
    } catch (error) {
      return { total: 0, available: 0, sold: 0, validated: 0 };
    }
  }
};
