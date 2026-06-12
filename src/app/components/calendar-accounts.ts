import { useCallback, useState } from "react";
import { toast } from "sonner";

export type CalendarProvider = "google" | "outlook";

export const PROVIDER_NAMES: Record<CalendarProvider, string> = {
  google: "Google Calendar",
  outlook: "Outlook Calendar",
};

export interface CalendarAccount {
  id: string;
  provider: CalendarProvider;
  email: string;
}

const ACCOUNTS_KEY = "ttt_cal_accounts";
const CAL_STATE_KEY = "ttt_cal_state";
const CONNECT_DELAY_MS = 1100;

const DEFAULT_ACCOUNTS: CalendarAccount[] = [
  { id: "acc_google_1", provider: "google", email: "kutskirill22@gmail.com" },
];

/** Demo accounts handed out when the user connects more providers/accounts */
const ACCOUNT_POOL: Record<CalendarProvider, Omit<CalendarAccount, "id">[]> = {
  google: [
    { provider: "google", email: "kutskirill22@gmail.com" },
    { provider: "google", email: "kirill@vektortms.com" },
  ],
  outlook: [
    { provider: "outlook", email: "kutskirill22@outlook.com" },
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
            const next = [...prev, { ...candidate, id: `acc_${provider}_${candidate.email}` }];
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

  return { accounts, connecting, connectAccount, disconnectAccount };
}