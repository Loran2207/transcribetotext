import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  type Template,
  type CreateTemplateData,
  type UpdateTemplateData,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
} from '@/lib/templates';

interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: Error | null;
  create: (data: CreateTemplateData) => Promise<Template | null>;
  update: (id: string, data: UpdateTemplateData) => Promise<Template | null>;
  remove: (id: string) => Promise<boolean>;
  setDefault: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (data: CreateTemplateData): Promise<Template | null> => {
      try {
        const created = await createTemplate(data);
        await refresh();
        toast.success('Template created');
        return created;
      } catch (err) {
        console.error('[useTemplates] create failed:', err);
        toast.error('Failed to create template');
        return null;
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, data: UpdateTemplateData): Promise<Template | null> => {
      try {
        const updated = await updateTemplate(id, data);
        await refresh();
        toast.success('Template updated');
        return updated;
      } catch (err) {
        console.error('[useTemplates] update failed:', err);
        toast.error('Failed to update template');
        return null;
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteTemplate(id);
        await refresh();
        toast.success('Template deleted');
        return true;
      } catch (err) {
        console.error('[useTemplates] delete failed:', err);
        toast.error('Failed to delete template');
        return false;
      }
    },
    [refresh],
  );

  const setDefault = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await setDefaultTemplate(id);
        await refresh();
        toast.success('Default template updated');
        return true;
      } catch (err) {
        console.error('[useTemplates] setDefault failed:', err);
        toast.error('Failed to set default template');
        return false;
      }
    },
    [refresh],
  );

  return { templates, isLoading, error, create, update, remove, setDefault, refresh };
}
