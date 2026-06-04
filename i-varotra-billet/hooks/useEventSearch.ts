import { useState, useMemo } from 'react';
import { Event } from '../services/EventService';

export const useEventSearch = (events: Event[]) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter(e => (e.name ?? '').toLowerCase().includes(q));
  }, [events, query]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return filtered
      .map(e => e.name ?? '')
      .filter(Boolean)
      .slice(0, 5);
  }, [filtered, query]);

  return { query, setQuery, filtered, suggestions };
};
