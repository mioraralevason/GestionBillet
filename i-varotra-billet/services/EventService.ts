import db from '../database/database';

/**
 * Represents an event in the system.
 */
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

/**
 * Service handling event-related database operations.
 */
export const EventService = {
  /**
   * Retrieves all events from the database, ordered by date descending.
   * @returns {Event[]} An array of event objects.
   */
  getEvents: (): Event[] => {
    try {
      return db.getAllSync(`SELECT * FROM events ORDER BY event_date DESC`);
    } catch (error) {
      console.error('Error fetching events', error);
      return [];
    }
  },

  /**
   * Adds a new event to the database.
   * @param {Event} event - The event data to insert.
   * @returns {number | null} The ID of the newly created event, or null if it failed.
   */
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
      console.error('Error adding event', error);
      return null;
    }
  },

  /**
   * Updates an existing event's information.
   * @param {Event} event - The event data to update (must include id).
   * @returns {boolean} True if the update was successful, false otherwise.
   */
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
      console.error('Error updating event', error);
      return false;
    }
  },

  /**
   * Deletes an event from the database.
   * @param {number} id - The unique identifier of the event.
   * @returns {boolean} True if deletion was successful.
   */
  deleteEvent: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM events WHERE id = ?`, id);
      return true;
    } catch (error) {
      console.error('Error deleting event', error);
      return false;
    }
  }
};
