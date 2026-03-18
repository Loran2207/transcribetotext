import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  children?: FolderItem[];
  createdAt?: string;
}

interface FolderContextType {
  folders: FolderItem[];
  addFolder: (name: string, color: string) => FolderItem;
  deleteFolder: (id: string) => void;
  /** Record IDs assigned to each folder */
  folderAssignments: Record<string, string>;
  assignToFolder: (recordIds: string[], folderId: string) => void;
}

const STORAGE_KEY = "ttt_folders";
const ASSIGNMENTS_KEY = "ttt_folder_assignments";

function loadFolders(): FolderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const FolderContext = createContext<FolderContextType | null>(null);

export function FolderProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<FolderItem[]>(loadFolders);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>(loadAssignments);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(folderAssignments)); }, [folderAssignments]);

  const addFolder = useCallback((name: string, color: string) => {
    const folder: FolderItem = { id: `folder_${Date.now()}`, name, color, createdAt: new Date().toISOString() };
    setFolders(prev => [...prev, folder]);
    return folder;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setFolderAssignments(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === id) delete next[key];
      }
      return next;
    });
  }, []);

  const assignToFolder = useCallback((recordIds: string[], folderId: string) => {
    setFolderAssignments(prev => {
      const next = { ...prev };
      for (const id of recordIds) next[id] = folderId;
      return next;
    });
  }, []);

  return (
    <FolderContext.Provider value={{ folders, addFolder, deleteFolder, folderAssignments, assignToFolder }}>
      {children}
    </FolderContext.Provider>
  );
}

export function useFolders() {
  const ctx = useContext(FolderContext);
  if (!ctx) throw new Error("useFolders must be used within FolderProvider");
  return ctx;
}
