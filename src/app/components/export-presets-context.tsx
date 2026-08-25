import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportContentOptions,
  type ExportFormat,
} from "@/lib/export-formats";

export interface ExportPresetSettings {
  format: ExportFormat;
  includeTranscript: boolean;
  includeSummary: boolean;
  includeAudio: boolean;
  includeTranslation: boolean;
  translationLanguage: string;
  zipEnabled: boolean;
  options: ExportContentOptions;
}

export interface ExportPreset {
  id: string;
  name: string;
  settings: ExportPresetSettings;
}

interface ExportPresetsContextValue {
  presets: ExportPreset[];
  createPreset: (name: string, settings: ExportPresetSettings) => ExportPreset;
  updatePreset: (id: string, patch: Partial<Omit<ExportPreset, "id">>) => void;
  deletePreset: (id: string) => void;
}

const STORAGE_KEY = "ttt_export_presets_v1";

export const EMPTY_EXPORT_SETTINGS: ExportPresetSettings = {
  format: "txt",
  includeTranscript: true,
  includeSummary: false,
  includeAudio: false,
  includeTranslation: false,
  translationLanguage: "es",
  zipEnabled: false,
  options: DEFAULT_EXPORT_OPTIONS,
};

const STARTER_PRESETS: ExportPreset[] = [
  {
    id: "starter-plain-text",
    name: "Plain text",
    settings: {
      ...EMPTY_EXPORT_SETTINGS,
      format: "txt",
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        showSpeakers: false,
        showTimestamps: false,
      },
    },
  },
  {
    id: "starter-word",
    name: "Word document",
    settings: { ...EMPTY_EXPORT_SETTINGS, format: "docx" },
  },
  {
    id: "starter-pdf",
    name: "PDF document",
    settings: { ...EMPTY_EXPORT_SETTINGS, format: "pdf", includeSummary: true },
  },
  {
    id: "starter-srt",
    name: "SRT captions",
    settings: {
      ...EMPTY_EXPORT_SETTINGS,
      format: "srt",
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        showSpeakers: false,
        showTimestamps: true,
      },
    },
  },
  {
    id: "starter-vtt",
    name: "VTT captions",
    settings: {
      ...EMPTY_EXPORT_SETTINGS,
      format: "vtt",
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        showSpeakers: false,
        showTimestamps: true,
      },
    },
  },
];

const ExportPresetsContext = createContext<ExportPresetsContextValue | null>(null);

function cloneSettings(settings: ExportPresetSettings): ExportPresetSettings {
  return { ...settings, options: { ...settings.options } };
}

function readPresets(): ExportPreset[] {
  if (typeof window === "undefined") return STARTER_PRESETS;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return STARTER_PRESETS;
  try {
    const parsed = JSON.parse(stored) as ExportPreset[];
    return Array.isArray(parsed) ? parsed : STARTER_PRESETS;
  } catch {
    return STARTER_PRESETS;
  }
}

export function ExportPresetsProvider({ children }: { children: React.ReactNode }) {
  const [presets, setPresets] = useState<ExportPreset[]>(readPresets);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const value = useMemo<ExportPresetsContextValue>(() => ({
    presets,
    createPreset(name, settings) {
      const preset = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `preset-${Date.now()}`,
        name: name.trim() || "Untitled preset",
        settings: cloneSettings(settings),
      };
      setPresets((current) => [...current, preset]);
      return preset;
    },
    updatePreset(id, patch) {
      setPresets((current) => current.map((preset) => preset.id === id
        ? {
            ...preset,
            ...patch,
            settings: patch.settings ? cloneSettings(patch.settings) : preset.settings,
          }
        : preset));
    },
    deletePreset(id) {
      setPresets((current) => current.filter((preset) => preset.id !== id));
    },
  }), [presets]);

  return (
    <ExportPresetsContext.Provider value={value}>
      {children}
    </ExportPresetsContext.Provider>
  );
}

export function useExportPresets() {
  const value = useContext(ExportPresetsContext);
  if (!value) throw new Error("useExportPresets must be used inside ExportPresetsProvider");
  return value;
}
