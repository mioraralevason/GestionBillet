import db from '../database/database';
import { TicketService } from './TicketService';

/**
 * Result object for a ticket validation attempt.
 */
export interface ValidationResult {
  success: boolean;
  message: string;
  ticket?: any;
  warning?: boolean;
}

/**
 * Service handling ticket validation and entry control (check-ins).
 */
export const AttendanceService = {
  /**
   * Validates a ticket using its QR code string.
   * Checks for existence, previous usage, and payment status.
   * @param {string} qrCode - The raw QR code data.
   * @returns {ValidationResult} Result of the validation process.
   */
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
        return { success: false, message: 'Billet non trouvé' };
      }

      // 1. Check if already validated
      if (ticket.status_id === TicketService.STATUS_VALIDE) {
        return { success: false, message: 'Billet déjà utilisé / vérifié', ticket, warning: true };
      }

      // 2. Check if fully paid
      const totalPaid = ticket.total_paid || 0;
      if (totalPaid < ticket.price) {
        return { 
          success: false, 
          message: `Billet non payé intégralement (${totalPaid} / ${ticket.price} Ar). Accès refusé.`, 
          ticket 
        };
      }

      // 3. Mark as validated
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
        message: 'Billet Valide ! Accès autorisé.', 
        ticket: { ...ticket, status_id: TicketService.STATUS_VALIDE, status_name: 'Vérifié' } 
      };
    } catch (error) {
      console.error('Validation error', error);
      return { success: false, message: 'Erreur lors de la validation' };
    }
  },

  /**
   * Validates a ticket by its ID (manual verification).
   * @param {number} ticketId - ID of the ticket.
   * @returns {ValidationResult} Result of the verification.
   */
  verifyTicketById: (ticketId: number): ValidationResult => {
    try {
      const ticket: any = db.getFirstSync(
        `SELECT t.*, e.name as event_name, s.name as status_name, b.name as buyer_name,
         (SELECT SUM(amount) FROM payments WHERE ticket_id = t.id) as total_paid
         FROM tickets t 
         JOIN events e ON t.event_id = e.id 
         LEFT JOIN status s ON t.status_id = s.id
         LEFT JOIN buyers b ON t.buyer_id = b.id
         WHERE t.id = ?`,
        ticketId
      );

      if (!ticket) {
        return { success: false, message: 'Billet non trouvé' };
      }

      if (ticket.status_id === TicketService.STATUS_VALIDE) {
        return { success: false, message: 'Billet déjà utilisé / vérifié', ticket, warning: true };
      }

      const totalPaid = ticket.total_paid || 0;
      if (totalPaid < ticket.price) {
        return { 
          success: false, 
          message: `Billet non payé intégralement (${totalPaid} / ${ticket.price} Ar). Accès refusé.`, 
          ticket 
        };
      }

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
        message: 'Billet vérifié avec succès !', 
        ticket: { ...ticket, status_id: TicketService.STATUS_VALIDE, status_name: 'Vérifié' } 
      };
    } catch (error) {
      console.error('Manual verification error', error);
      return { success: false, message: 'Erreur lors de la vérification' };
    }
  },

  /**
   * Retrieves attendance records for a specific event.
   * @param {number} eventId - Event ID.
   * @returns {any[]} List of attendance records.
   */
  getAttendanceByEvent: (eventId: number) => {
    try {
      return db.getAllSync(
        `SELECT a.*, t.ticket_number, b.name as buyer_name
         FROM attendance a
         JOIN tickets t ON a.ticket_id = t.id
         LEFT JOIN buyers b ON b.id = t.buyer_id
         WHERE t.event_id = ?
         ORDER BY a.checkin_time DESC`,
        eventId
      );
    } catch (error) {
      console.error('Error fetching attendance', error);
      return [];
    }
  }
};
