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
  img_scale?: number;
  img_rotate?: number;
  img_x?: number;
  img_y?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Represents a type of ticket for an event.
 */
export interface TicketType {
  id?: number;
  event_id: number;
  name: string;
  price: number;
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

  getEventById: (id: number): Event | null => {
    try {
      return db.getFirstSync(`SELECT * FROM events WHERE id = ?`, id) || null;
    } catch (error) {
      console.error('Error fetching event', error);
      return null;
    }
  },

  /**
   * Retrieves all ticket types for a specific event.
   * @param {number} eventId - The ID of the event.
   * @returns {TicketType[]} An array of ticket type objects.
   */
  getTicketTypes: (eventId: number): TicketType[] => {
    try {
      return db.getAllSync(`SELECT * FROM ticket_types WHERE event_id = ?`, eventId);
    } catch (error) {
      console.error('Error fetching ticket types', error);
      return [];
    }
  },

  /**
   * Adds a new ticket type to an event.
   * @param {TicketType} type - The ticket type data to insert.
   * @returns {number | null} The ID of the newly created ticket type.
   */
  addTicketType: (type: TicketType): number | null => {
    try {
      const result = db.runSync(
        `INSERT INTO ticket_types (event_id, name, price) VALUES (?, ?, ?)`,
        type.event_id,
        type.name,
        type.price
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding ticket type', error);
      return null;
    }
  },

  /**
   * Retrieves the last 10 created events.
   * @returns {Event[]} An array of event objects.
   */
  getRecentCreations: (): Event[] => {
    try {
      return db.getAllSync(`SELECT * FROM events ORDER BY created_at DESC LIMIT 10`);
    } catch (error) {
      console.error('Error fetching recent events', error);
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
        `INSERT INTO events (name, event_date, description, slogan, image, color, img_scale, img_rotate, img_x, img_y) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        event.name || '',
        event.event_date,
        event.description || '',
        event.slogan || '',
        event.image || '',
        event.color || '#007AFF',
        event.img_scale || 1.0,
        event.img_rotate || 0.0,
        event.img_x || 0.0,
        event.img_y || 0.0
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
        `UPDATE events SET name = ?, event_date = ?, description = ?, slogan = ?, image = ?, color = ?, 
         img_scale = ?, img_rotate = ?, img_x = ?, img_y = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        event.name || '',
        event.event_date,
        event.description || '',
        event.slogan || '',
        event.image || '',
        event.color || '#007AFF',
        event.img_scale || 1.0,
        event.img_rotate || 0.0,
        event.img_x || 0.0,
        event.img_y || 0.0,
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
  },

  /**
   * Updates an existing ticket type.
   * @param {TicketType} type - The ticket type data to update (must include id).
   * @returns {boolean} True if the update was successful.
   */
  updateTicketType: (type: TicketType): boolean => {
    if (!type.id) return false;
    try {
      db.runSync(
        `UPDATE ticket_types SET name = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        type.name,
        type.price,
        type.id
      );
      return true;
    } catch (error) {
      console.error('Error updating ticket type', error);
      return false;
    }
  },

  /**
   * Deletes a ticket type from the database.
   * @param {number} id - The unique identifier of the ticket type.
   * @returns {boolean} True if deletion was successful.
   */
  deleteTicketType: (id: number): boolean => {
    try {
      db.runSync(`DELETE FROM ticket_types WHERE id = ?`, id);
      return true;
    } catch (error) {
      console.error('Error deleting ticket type', error);
      return false;
    }
  },

  /**
   * Deletes all ticket types for a specific event.
   * @param {number} eventId - The ID of the event.
   * @returns {boolean} True if deletion was successful.
   */
  deleteTicketTypesByEvent: (eventId: number): boolean => {
    try {
      db.runSync(`DELETE FROM ticket_types WHERE event_id = ?`, eventId);
      return true;
    } catch (error) {
      console.error('Error deleting ticket types by event', error);
      return false;
    }
  }
};
