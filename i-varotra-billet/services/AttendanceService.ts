import db from '../database/database';
import { TicketService } from './TicketService';

export interface ValidationResult {
  success: boolean;
  message: string;
  ticket?: any;
  warning?: boolean;
}

export const AttendanceService = {
  validateTicket: (qrCode: string): ValidationResult => {
    try {
      const ticket: any = db.getFirstSync(
        `SELECT t.*, e.name as event_name, s.name as status_name, b.name as buyer_name,
         (SELECT SUM(amount) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t 
         JOIN events e ON t.event_id = e.id 
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         WHERE t.qr_code = ?`,
        qrCode
      );

      if (!ticket) {
        return { success: false, message: 'Billet inexistant' };
      }

      // 1. Vérifier si le billet est déjà validé
      if (ticket.status_id === TicketService.STATUS_VALIDE) {
        return { success: false, message: 'Billet déjà utilisé / vérifié', ticket, warning: true };
      }

      // 2. Vérifier si le billet est payé
      const totalPaid = ticket.total_paid || 0;
      if (totalPaid < ticket.price) {
        return { 
          success: false, 
          message: `Billet non payé entièrement (${totalPaid} / ${ticket.price} Ar). Entrée refusée.`, 
          ticket 
        };
      }

      // 3. Valider le billet
      db.runSync(
        `UPDATE tickets SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        TicketService.STATUS_VALIDE,
        ticket.id
      );

      db.runSync(
        `INSERT OR REPLACE INTO attendance (ticket_id, status_id, checkin_time) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        ticket.id,
        TicketService.STATUS_VALIDE
      );

      return { 
        success: true, 
        message: 'Billet valide ! Entrée autorisée.', 
        ticket: { ...ticket, status_id: TicketService.STATUS_VALIDE, status_name: 'Validé' } 
      };
    } catch (error) {
      console.error('Erreur validation', error);
      return { success: false, message: 'Erreur lors de la validation' };
    }
  },

  getAttendanceByEvent: (eventId: number) => {
    try {
      return db.getAllSync(
        `SELECT a.*, t.ticket_number, b.name as buyer_name
         FROM attendance a
         JOIN tickets t ON a.ticket_id = t.id
         LEFT JOIN buyers b ON b.ticket_id = t.id
         WHERE t.event_id = ?
         ORDER BY a.checkin_time DESC`,
        eventId
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des présences', error);
      return [];
    }
  }
};
