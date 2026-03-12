import db from '../database/database';

export interface Payment {
  id?: number;
  ticket_id: number;
  amount: number;
  payment_date?: string;
  created_at?: string;
}

export const PaymentService = {
  addPayment: (ticketId: number, amount: number): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO payments (ticket_id, amount) VALUES (?, ?)`,
        ticketId,
        amount
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement', error);
      return null;
    }
  },

  getPaymentsByTicket: (ticketId: number): Payment[] => {
    try {
      return db.getAllSync(
        `SELECT * FROM payments WHERE ticket_id = ? ORDER BY payment_date DESC`,
        ticketId
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements', error);
      return [];
    }
  },

  getTotalPaidForTicket: (ticketId: number): number => {
    try {
      const result: any = db.getFirstSync(
        `SELECT SUM(amount) as total FROM payments WHERE ticket_id = ?`,
        ticketId
      );
      return result ? result.total || 0 : 0;
    } catch (error) {
      console.error('Erreur lors du calcul du total payé', error);
      return 0;
    }
  }
};
