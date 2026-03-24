import db from '../database/database';

export interface Event {
  id?: number;
  name?: string;
  event_date: string;
  description?: string;
  slogan?: string;
  image?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export const EventService = {
  getEvents: (): Event[] => {
    try {
      return db.getAllSync(`SELECT * FROM events ORDER BY event_date DESC`);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements', error);
      return [];
    }
  },

  addEvent: (event: Event): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO events (name, event_date, description, slogan, image, color) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        event.name || '',
        event.event_date,
        event.description || '',
        event.slogan || '',
        event.image || '',
        event.color || '#007AFF'
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'événement', error);
      return null;
    }
  },

  updateEvent: (event: Event): boolean => {
    if (!event.id) return false;
    try {
      db.runSync(
        `UPDATE events SET name = ?, event_date = ?, description = ?, slogan = ?, image = ?, color = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        event.name || '',
        event.event_date,
        event.description || '',
        event.slogan || '',
        event.image || '',
        event.color || '#007AFF',
        event.id
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement', error);
      return false;
    }
  },

  deleteEvent: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM events WHERE id = ?`, id);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement', error);
      return false;
    }
  }
};
