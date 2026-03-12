import db from '../database/database';

export interface Buyer {
  id?: number;
  name: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
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
      // On cherche d'abord si l'acheteur existe déjà par nom et téléphone
      const existing: any = db.getFirstSync(
        `SELECT id FROM buyers WHERE name = ? AND phone = ?`,
        buyer.name,
        buyer.phone || ''
      );
      
      if (existing) return existing.id;

      const result = db.runSync(
        `INSERT INTO buyers (name, phone) VALUES (?, ?)`,
        buyer.name,
        buyer.phone || ''
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
        `UPDATE buyers SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        buyer.name,
        buyer.phone || '',
        buyer.id
      );
      return true;
    } catch (error) { return false; }
  },

  deleteBuyer: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM buyers WHERE id = ?`, id);
      return true;
    } catch (error) { return false; }
  }
};
