import { useCallback, useState } from "react";
import { toast } from "sonner";

export type CalendarProvider = "google" | "outlook";

export const PROVIDER_NAMES: Record<CalendarProvider, string> = {
  google: "Google Calendar",
  outlook: "Outlook Calendar",
};

export interface AccountCalendar {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  isPrimary?: boolean;
}

export interface CalendarAccount {
  id: string;
  provider: CalendarProvider;
  email: string;
  calendars: AccountCalendar[];
}

const ACCOUNTS_KEY = "ttt_cal_accounts";
const CAL_STATE_KEY = "ttt_cal_state";
const CONNECT_DELAY_MS = 1100;

const DEFAULT_ACCOUNTS: CalendarAccount[] = [
  {
    id: "acc_google_1",
    provider: "google",
    email: "kutskirill22@gmail.com",
    calendars: [
      { id: "g1_main", name: "kutskirill22@gmail.com", color: "#4285F4", enabled: true, isPrimary: true },
      { id: "g1_holidays", name: "Holidays in Belarus", color: "#0D9488", enabled: true },
    ],
  },
];

/** Demo accounts handed out when the user connects more providers/accounts */
const ACCOUNT_POOL: Record<CalendarProvider, Omit<CalendarAccount, "id">[]> = {
  google: [
    {
      provider: "google",
      email: "kutskirill22@gmail.com",
      calendars: [
        { id: "g1_main", name: "kutskirill22@gmail.com", color: "#4285F4", enabled: true, isPrimary: true },
        { id: "g1_holidays", name: "Holidays in Belarus", color: "#0D9488", enabled: true },
      ],
    },
    {
      provider: "google",
      email: "kirill@vektortms.com",
      calendars: [
        { id: "g2_main", name: "kirill@vektortms.com", color: "#F4511E", enabled: true, isPrimary: true },
        { id: "g2_team", name: "Vektor team events", color: "#8E24AA", enabled: true },
      ],
    },
  ],
  outlook: [
    {
      provider: "outlook",
      email: "kutskirill22@outlook.com",
      calendars: [
        { id: "o1_main", name: "Calendar", color: "#106EBE", enabled: true, isPrimary: true },
        { id: "o1_birthdays", name: "Birthdays", color: "#C239B3", enabled: true },
      ],
    },
  ],
};

function loadAccounts(): CalendarAccount[] {
  try {
    // Demo flag: ttt_cal_state=connect → start with nothing connected
    if (localStorage.getItem(CAL_STATE_KEY) === "connect") return [];
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CalendarAccount[];
    }
  } catch { /* localStorage unavailable or corrupted */ }
  return DEFAULT_ACCOUNTS;
}

function saveAccounts(accounts: CalendarAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (localStorage.getItem(CAL_STATE_KEY) === "connect") {
      localStorage.removeItem(CAL_STATE_KEY);
    }
  } catch { /* ignore */ }
}

export interface UseCalendarAccountsReturn {
  accounts: CalendarAccount[];
  /** Provider currently going through the mock OAuth flow, if any */
  connecting: CalendarProvider | null;
  /** Resolves true once the account is connected, false if nothing left to connect */
  connectAccount: (provider: CalendarProvider) => Promise<boolean>;
  disconnectAccount: (accountId: string) => void;
  toggleCalendar: (accountId: string, calendarId: string) => void;
}

export function useCalendarAccounts(): UseCalendarAccountsReturn {
  const [accounts, setAccounts] = useState<CalendarAccount[]>(loadAccounts);
  const [connecting, setConnecting] = useState<CalendarProvider | null>(null);

  const connectAccount = useCallback((provider: CalendarProvider): Promise<boolean> => {
    return new Promise((resolve) => {
      setAccounts((current) => {
        const candidate = ACCOUNT_POOL[provider].find(
          (a) => !current.some((x) => x.email === a.email),
        );
        if (!candidate) {
          toast(`All demo ${PROVIDER_NAMES[provider]} accounts are already connected`);
          resolve(false);
          return current;
        }
        setConnecting(provider);
        window.setTimeout(() => {
          setAccounts((prev) => {
            if (prev.some((x) => x.email === candidate.email)) return prev;
            const next = [...prev, { ...candidate, id: `acc_${provider}_${prev.length + 1}_${candidate.email}` }];
            saveAccounts(next);
            return next;
          });
          setConnecting(null);
          toast(`${candidate.email} connected`);
          resolve(true);
        }, CONNECT_DELAY_MS);
        return current;
      });
    });
  }, []);

  const disconnectAccount = useCallback((accountId: string) => {
    setAccounts((prev) => {
      const account = prev.find((a) => a.id === accountId);
      const next = prev.filter((a) => a.id !== accountId);
      saveAccounts(next);
      if (account) toast(`${account.email} disconnected`);
      return next;
    });
  }, []);

  const toggleCalendar = useCallback((accountId: string, calendarId: string) => {
    setAccounts((prev) => {
      const next = prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              calendars: a.calendars.map((c) =>
                c.id === calendarId ? { ...c, enabled: !c.enabled } : c,
              ),
            }
          : a,
      );
      saveAccounts(next);
      return next;
    });
  }, []);

  return { accounts, connecting, connectAccount, disconnectAccount, toggleCalendar };
}