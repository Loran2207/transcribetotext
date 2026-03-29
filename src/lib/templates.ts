import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateSection {
  id: string;
  title: string;
  instruction: string;
  iconId?: string;
}

export type TemplateType = 'built_in' | 'custom';

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  sections: TemplateSection[];
  type: TemplateType;
  is_locked: boolean;
  is_default: boolean;
  auto_assign_keywords: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type CreateTemplateData = Pick<
  Template,
  'name' | 'description' | 'instructions' | 'sections' | 'auto_assign_keywords' | 'is_default'
>;

export type UpdateTemplateData = Partial<CreateTemplateData>;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all built-in + current user's custom templates. */
export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('type', { ascending: true }) // built_in first
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Template[];
}

/** Fetch a single template by ID. */
export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data as Template;
}

/** Create a custom template for the current user. */
export async function createTemplate(input: CreateTemplateData): Promise<Template> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If setting as default, clear other defaults first
  if (input.is_default) {
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      instructions: input.instructions,
      sections: input.sections,
      auto_assign_keywords: input.auto_assign_keywords ?? [],
      is_default: input.is_default ?? false,
      type: 'custom',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Template;
}

/** Update a custom template (only if owned by current user — enforced by RLS). */
export async function updateTemplate(id: string, input: UpdateTemplateData): Promise<Template> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If setting as default, clear other defaults first
  if (input.is_default) {
    await supabase
      .from('templates')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', id);
  }

  const { data, error } = await supabase
    .from('templates')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Template;
}

/** Delete a custom template (only if owned by current user — enforced by RLS). */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** Set a template as the user's default (clears any previous default). */
export async function setDefaultTemplate(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Clear all defaults for this user
  const { error: clearError } = await supabase
    .from('templates')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .eq('is_default', true);

  if (clearError) throw clearError;

  // Set the new default
  const { error } = await supabase
    .from('templates')
    .update({ is_default: true })
    .eq('id', id);

  if (error) throw error;
}

/** Link a template to a transcription and increment usage count. */
export async function applyTemplateToTranscription(
  transcriptionId: string,
  templateId: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from('transcriptions')
    .update({ template_id: templateId })
    .eq('id', transcriptionId);

  if (updateError) throw updateError;

  const { error: rpcError } = await supabase.rpc('increment_template_usage', {
    template_uuid: templateId,
  });

  if (rpcError) throw rpcError;
}

/**
 * Find the first template whose auto_assign_keywords match the given title.
 * Checks user's custom templates first, then built-ins.
 */
export async function getAutoAssignTemplate(
  transcriptionTitle: string,
): Promise<Template | null> {
  const templates = await getTemplates();
  const lowerTitle = transcriptionTitle.toLowerCase();

  // Custom templates first (they appear after built-in in the sorted list, so reverse)
  const customFirst = [
    ...templates.filter((t) => t.type === 'custom'),
    ...templates.filter((t) => t.type === 'built_in'),
  ];

  for (const template of customFirst) {
    if (template.is_locked) continue;
    const keywords = template.auto_assign_keywords ?? [];
    if (keywords.length === 0) continue;

    const matched = keywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
    if (matched) return template;
  }

  return null;
}
