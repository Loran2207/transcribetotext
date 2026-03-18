import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SourceType } from "./source-icons";

export interface StarredRecord {
  id: string;
  name: string;
  iconColor: string;
  iconType: "square" | "circle" | "link";
  source: SourceType;
}

interface StarredContextType {
  starred: Set<string>;
  starredRecords: StarredRecord[];
  toggleStar: (id: string, record?: StarredRecord) => void;
  renameRecord: (id: string, newName: string) => void;
  getName: (id: string, fallback: string) => string;
}

const StarredContext = createContext<StarredContextType | null>(null);

export function StarredProvider({ children }: { children: ReactNode }) {
  const [starredRecords, setStarredRecords] = useState<StarredRecord[]>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});

  const starred = new Set(starredRecords.map((r) => r.id));

  const toggleStar = useCallback((id: string, record?: StarredRecord) => {
    setStarredRecords((prev) => {
      const exists = prev.find((r) => r.id === id);
      if (exists) return prev.filter((r) => r.id !== id);
      if (record) return [...prev, record];
      return prev;
    });
  }, []);

  const renameRecord = useCallback((id: string, newName: string) => {
    setRenames((prev) => ({ ...prev, [id]: newName }));
    setStarredRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  }, []);

  const getName = useCallback(
    (id: string, fallback: string) => renames[id] ?? fallback,
    [renames]
  );

  return (
    <StarredContext.Provider value={{ starred, starredRecords, toggleStar, renameRecord, getName }}>
      {children}
    </StarredContext.Provider>
  );
}

export function useStarred() {
  const ctx = useContext(StarredContext);
  if (!ctx) throw new Error("useStarred must be used within StarredProvider");
  return ctx;
}