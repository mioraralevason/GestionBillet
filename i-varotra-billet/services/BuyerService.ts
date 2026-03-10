// services/BuyerService.ts
import db from '../database/database';

export interface Buyer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export const BuyerService = {
  getBuyers: (): Buyer[] => {
    try {
      return db.getAllSync(`SELECT * FROM buyers ORDER BY name ASC`);
    } catch (error) {
      console.error('Erreur lors de la récupération des acheteurs', error);
      return [];
    }
  },

  addBuyer: (buyer: Buyer): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO buyers (name, phone, email, created_at) VALUES (?, ?, ?, datetime('now'))`,
        buyer.name,
        buyer.phone || '',
        buyer.email || ''
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'acheteur', error);
      return null;
    }
  },

  updateBuyer: (buyer: Buyer): boolean => {
    if (!buyer.id) return false;
    try {
      db.runSync(
        `UPDATE buyers SET name = ?, phone = ?, email = ? WHERE id = ?`,
        buyer.name,
        buyer.phone || '',
        buyer.email || '',
        buyer.id
      );
      return true;
    } catch (error) {
      return false;
    }
  },

  deleteBuyer: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM buyers WHERE id = ?`, id);
      return true;
    } catch (error) {
      return false;
    }
  }
};
