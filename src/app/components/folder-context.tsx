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
  addFolder: (name: string, color: string, parentId?: string | null) => FolderItem;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  changeFolderColor: (id: string, color: string) => void;
  moveFolder: (folderId: string, targetId: string | null) => void;
  /** Record IDs assigned to each folder */
  folderAssignments: Record<string, string>;
  assignToFolder: (recordIds: string[], folderId: string) => void;
}

const STORAGE_KEY = "ttt_folders";
const ASSIGNMENTS_KEY = "ttt_folder_assignments";
const DEFAULTS_VERSION_KEY = "ttt_defaults_v";
const CURRENT_DEFAULTS_VERSION = "2";

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: "folder_demo_sprint", name: "Sprint Planning", color: "#6366F1", createdAt: "2026-03-13T09:00:00.000Z" },
  { id: "folder_demo_clients", name: "Client Calls", color: "#2563EB", createdAt: "2026-03-14T10:00:00.000Z" },
  { id: "folder_demo_design", name: "Design Reviews", color: "#10B981", createdAt: "2026-03-15T11:00:00.000Z" },
  { id: "folder_demo_retros", name: "Team Retros", color: "#F59E0B", createdAt: "2026-03-16T12:00:00.000Z" },
];

const DEFAULT_ASSIGNMENTS: Record<string, string> = {
  "1": "folder_demo_sprint",
  "2": "folder_demo_clients",
  "3": "folder_demo_design",
  "4": "folder_demo_design",
  "5": "folder_demo_retros",
  "6": "folder_demo_clients",
};

/* ── Tree helpers (immutable) ── */

function cloneFolders(folders: FolderItem[]): FolderItem[] {
  return folders.map((f) => ({ ...f, children: f.children ? cloneFolders(f.children) : undefined }));
}

function updateInTree(folders: FolderItem[], id: string, updater: (f: FolderItem) => FolderItem): FolderItem[] {
  return folders.map((f) => {
    if (f.id === id) return updater(f);
    if (f.children) return { ...f, children: updateInTree(f.children, id, updater) };
    return f;
  });
}

function removeFromTree(folders: FolderItem[], id: string): [FolderItem[], FolderItem | null] {
  let removed: FolderItem | null = null;
  const result = folders.reduce<FolderItem[]>((acc, f) => {
    if (f.id === id) { removed = f; return acc; }
    if (f.children) {
      const [newChildren, found] = removeFromTree(f.children, id);
      if (found) removed = found;
      return [...acc, { ...f, children: newChildren }];
    }
    return [...acc, f];
  }, []);
  return [result, removed];
}

function addToTree(folders: FolderItem[], targetId: string | null, item: FolderItem): FolderItem[] {
  if (targetId === null) return [...folders, item];
  return folders.map((f) => {
    if (f.id === targetId) return { ...f, children: [...(f.children ?? []), item] };
    if (f.children) return { ...f, children: addToTree(f.children, targetId, item) };
    return f;
  });
}

/* ── Storage ── */

function loadFolders(): FolderItem[] {
  try {
    const version = localStorage.getItem(DEFAULTS_VERSION_KEY);
    if (version !== CURRENT_DEFAULTS_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ASSIGNMENTS_KEY);
      localStorage.setItem(DEFAULTS_VERSION_KEY, CURRENT_DEFAULTS_VERSION);
      return cloneFolders(DEFAULT_FOLDERS);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneFolders(DEFAULT_FOLDERS);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return cloneFolders(DEFAULT_FOLDERS);
  } catch { return cloneFolders(DEFAULT_FOLDERS); }
}

function loadAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (!raw) return { ...DEFAULT_ASSIGNMENTS };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return parsed;
    return { ...DEFAULT_ASSIGNMENTS };
  } catch { return { ...DEFAULT_ASSIGNMENTS }; }
}

/* ── Context ── */

const FolderContext = createContext<FolderContextType | null>(null);

export function FolderProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<FolderItem[]>(loadFolders);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>(loadAssignments);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(folderAssignments)); }, [folderAssignments]);

  const addFolder = useCallback((name: string, color: string, parentId?: string | null) => {
    const folder: FolderItem = { id: `folder_${Date.now()}`, name, color, createdAt: new Date().toISOString() };
    setFolders(prev => addToTree(prev, parentId ?? null, folder));
    return folder;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    if (!name.trim()) return;
    setFolders(prev => updateInTree(prev, id, (f) => ({ ...f, name: name.trim() })));
  }, []);

  const changeFolderColor = useCallback((id: string, color: string) => {
    setFolders(prev => updateInTree(prev, id, (f) => ({ ...f, color })));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => {
      const [result] = removeFromTree(prev, id);
      return result;
    });
    setFolderAssignments(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === id) delete next[key];
      }
      return next;
    });
  }, []);

  const moveFolder = useCallback((folderId: string, targetId: string | null) => {
    setFolders(prev => {
      const [withoutFolder, moved] = removeFromTree(prev, folderId);
      if (!moved) return prev;
      // Prevent moving into itself or its own descendant
      if (targetId !== null) {
        function isDescendant(folder: FolderItem, id: string): boolean {
          return (folder.children ?? []).some(c => c.id === id || isDescendant(c, id));
        }
        if (moved.id === targetId || isDescendant(moved, targetId)) return prev;
      }
      return addToTree(withoutFolder, targetId, moved);
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
    <FolderContext.Provider value={{ folders, addFolder, deleteFolder, renameFolder, changeFolderColor, moveFolder, folderAssignments, assignToFolder }}>
      {children}
    </FolderContext.Provider>
  );
}

export function useFolders() {
  const ctx = useContext(FolderContext);
  if (!ctx) throw new Error("useFolders must be used within FolderProvider");
  return ctx;
}
