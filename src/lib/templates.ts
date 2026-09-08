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

/** Update a custom template (only if owned by current user - enforced by RLS). */
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

/** Delete a custom template (only if owned by current user - enforced by RLS). */
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

// ---------------------------------------------------------------------------
// Offline fallback: the demo portal has no live Supabase, so the account still
// gets a working set of templates instead of an error toast and an empty list.
// ---------------------------------------------------------------------------

const demoTemplate = (id: string, name: string, description: string, sections: [string, string, string][]): Template => ({
  id, user_id: null, name, description, instructions: null,
  sections: sections.map(([sid, title, instruction]) => ({ id: sid, title, instruction })),
  type: 'built_in', is_locked: true, is_default: id === 'demo-meeting', auto_assign_keywords: [], usage_count: 0,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
});

export const DEMO_TEMPLATES: Template[] = [
  demoTemplate('demo-meeting', 'Meeting Notes', 'Decisions, action items and open questions', [
    ['s1', 'Summary', 'Three sentences on what the call was about'],
    ['s2', 'Decisions', 'What was agreed, one line each'],
    ['s3', 'Action items', 'Who does what by when'],
    ['s4', 'Open questions', 'What is still unresolved'],
  ]),
  demoTemplate('demo-sales', 'Sales Call', 'Needs, objections and next step', [
    ['s1', 'Summary', 'The prospect and what they need'],
    ['s2', 'Objections', 'What held them back'],
    ['s3', 'Next step', 'The one thing that moves the deal'],
  ]),
  demoTemplate('demo-1on1', '1 by 1', 'Wins, blockers and follow-ups', [
    ['s1', 'Wins', 'What went well since last time'],
    ['s2', 'Blockers', 'What is in the way'],
    ['s3', 'Follow-ups', 'What each side does next'],
  ]),
];
