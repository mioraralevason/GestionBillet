import db from '../database/database';

/**
 * Represents a buyer in the system.
 */
export interface Buyer {
  id?: number;
  name: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service handling buyer-related database operations.
 */
export const BuyerService = {
  /**
   * Retrieves all buyers from the database, ordered by name.
   * @returns {Buyer[]} List of buyers.
   */
  getBuyers: (): Buyer[] => {
    try {
      return db.getAllSync(`SELECT * FROM buyers ORDER BY name ASC`);
    } catch (error) {
      console.error('Error fetching buyers', error);
      return [];
    }
  },

  /**
   * Adds a new buyer or returns the ID of an existing one (matching name and phone).
   * @param {Buyer} buyer - Buyer data to insert.
   * @returns {number | null} The ID of the buyer.
   */
  addBuyer: (buyer: Buyer): number | null => {
    try {
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
      console.error('Error adding buyer', error);
      return null;
    }
  },

  /**
   * Updates an existing buyer's information.
   * @param {Buyer} buyer - Buyer data to update.
   * @returns {boolean} Success status.
   */
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

  /**
   * Deletes a buyer from the database.
   * @param {number} id - Buyer ID.
   * @returns {boolean} Success status.
   */
  deleteBuyer: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM buyers WHERE id = ?`, id);
      return true;
    } catch (error) { return false; }
  }
};
