// services/EventService.ts
import db from '../database/database';

export interface Event {
  id?: number;
  name?: string;
  date: string;
  description?: string;
  slogan?: string;
  image_uri?: string;
  created_at?: string;
}

export const EventService = {
  // Récupérer tous les événements
  getEvents: (): Event[] => {
    try {
      return db.getAllSync(`SELECT * FROM events ORDER BY date DESC`);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements', error);
      return [];
    }
  },

  // Ajouter un événement
  addEvent: (event: Event): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO events (name, date, description, slogan, image_uri, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        event.name || '',
        event.date,
        event.description || '',
        event.slogan || '',
        event.image_uri || ''
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'événement', error);
      return null;
    }
  },

  // Modifier un événement
  updateEvent: (event: Event): boolean => {
    if (!event.id) return false;
    try {
      db.runSync(
        `UPDATE events SET name = ?, date = ?, description = ?, slogan = ?, image_uri = ? 
         WHERE id = ?`,
        event.name || '',
        event.date,
        event.description || '',
        event.slogan || '',
        event.image_uri || '',
        event.id
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement', error);
      return false;
    }
  },

  // Supprimer un événement
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
