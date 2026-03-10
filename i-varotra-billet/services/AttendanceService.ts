// services/AttendanceService.ts
import db from '../database/database';

export interface ValidationResult {
  success: boolean;
  message: string;
  ticket?: any;
}

export const AttendanceService = {
  validateTicket: (qrData: string): ValidationResult => {
    try {
      // 1. Chercher le billet
      const ticket: any = db.getFirstSync(
        `SELECT t.*, e.name as event_name 
         FROM tickets t 
         JOIN events e ON t.event_id = e.id 
         WHERE t.qr_data = ?`,
        qrData
      );

      if (!ticket) {
        return { success: false, message: 'Billet inexistant' };
      }

      // 2. Vérifier s'il est déjà validé
      if (ticket.status === 'validé') {
        return { success: false, message: 'Billet déjà utilisé', ticket };
      }

      // 3. Valider le billet
      db.runSync(
        `UPDATE tickets SET status = 'validé' WHERE id = ?`,
        ticket.id
      );

      return { 
        success: true, 
        message: 'Billet valide ! Entrée autorisée.', 
        ticket: { ...ticket, status: 'validé' } 
      };
    } catch (error) {
      console.error('Erreur validation', error);
      return { success: false, message: 'Erreur lors de la validation' };
    }
  }
};
