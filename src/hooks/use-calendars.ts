import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface Calendar {
  id: string;
  calendar_name: string;
  color: string;
  is_enabled: boolean;
  is_primary: boolean;
}

interface UseCalendarsReturn {
  calendars: Calendar[];
  isLoading: boolean;
  isSyncing: boolean;
  toggleCalendar: (id: string, enabled: boolean) => void;
  syncCalendars: () => Promise<void>;
}

export function useCalendars(): UseCalendarsReturn {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const toggleCalendar = useCallback((id: string, enabled: boolean) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_enabled: enabled } : c)),
    );
  }, []);

  const syncCalendars = useCallback(async () => {
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast('Calendar sync coming soon');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { calendars, isLoading, isSyncing, toggleCalendar, syncCalendars };
}
