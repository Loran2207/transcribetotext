-- =============================================================================
-- Migration: templates_schema
-- Description: Create the templates table with RLS, seed built-in templates,
--              add template_id to transcriptions, and create helper functions.
-- =============================================================================

-- 1. Create the templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  instructions text,
  sections jsonb NOT NULL DEFAULT '[]',
  type text NOT NULL DEFAULT 'custom',
  is_locked boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  auto_assign_keywords text[] DEFAULT '{}',
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS and create policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Built-in templates (user_id IS NULL) are readable by everyone
CREATE POLICY "Built-in templates are viewable by everyone"
  ON templates FOR SELECT
  USING (type = 'built_in' AND user_id IS NULL);

-- Custom templates: full CRUD for owner only
CREATE POLICY "Users can view their own custom templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create custom templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND type = 'custom');

CREATE POLICY "Users can update their own custom templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id AND type = 'custom')
  WITH CHECK (auth.uid() = user_id AND type = 'custom');

CREATE POLICY "Users can delete their own custom templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id AND type = 'custom');

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Seed built-in templates
INSERT INTO templates (user_id, name, description, instructions, sections, type, is_locked, is_default, auto_assign_keywords) VALUES

-- a) General (default)
(NULL, 'General', 'Works for any type of meeting',
 'Summarize the meeting clearly and concisely. Focus on what was decided and what needs to happen next. Keep it under a 3-minute read.',
 '[{"id":"summary","title":"Summary","instruction":"Write a 2–4 sentence overview of the meeting."},{"id":"action_items","title":"Action items","instruction":"List specific tasks with owners if mentioned. Use bullet points."},{"id":"key_decisions","title":"Key decisions","instruction":"List the major decisions made during the meeting."}]'::jsonb,
 'built_in', false, true, '{}'),

-- b) Sales — BANT
(NULL, 'Sales — BANT', 'Sales discovery using the BANT framework',
 'Analyze this sales call using the BANT framework. Be specific and extract exact quotes when relevant.',
 '[{"id":"budget","title":"Budget","instruction":"Did the prospect mention budget range, constraints, or approval process?"},{"id":"authority","title":"Authority","instruction":"Who is the decision maker? Who else is involved?"},{"id":"need","title":"Need","instruction":"What problems are they trying to solve? What is the pain?"},{"id":"timeline","title":"Timeline","instruction":"What is their timeline to make a decision or implement?"},{"id":"next_steps","title":"Next steps","instruction":"What are the agreed next steps?"}]'::jsonb,
 'built_in', false, false, ARRAY['sales', 'discovery', 'demo', 'bant', 'prospect']),

-- c) 1-on-1
(NULL, '1-on-1', 'One-on-one meeting between manager and report',
 'Summarize this 1-on-1 meeting. Focus on the human side — mood, growth, and blockers — not just task updates.',
 '[{"id":"mood","title":"Mood & energy","instruction":"How did the person seem? Any signals worth noting?"},{"id":"progress","title":"Progress & updates","instruction":"What has been accomplished since last 1:1?"},{"id":"blockers","title":"Blockers","instruction":"What is slowing them down? What support do they need?"},{"id":"growth","title":"Growth & development","instruction":"Any career, skills, or development topics discussed?"},{"id":"action_items","title":"Action items","instruction":"Concrete next steps for both parties."}]'::jsonb,
 'built_in', false, false, ARRAY['1:1', 'one on one', '1-on-1', 'one-on-one', 'sync']),

-- d) Team meeting
(NULL, 'Team meeting', 'Team sync and status update',
 'Summarize this team meeting. Focus on decisions, blockers, and action items.',
 '[{"id":"summary","title":"Summary","instruction":"Brief overview of what was discussed."},{"id":"updates","title":"Status updates","instruction":"What did each person or team share?"},{"id":"blockers","title":"Blockers","instruction":"What is blocking the team?"},{"id":"decisions","title":"Decisions made","instruction":"List any decisions that were finalized."},{"id":"action_items","title":"Action items","instruction":"Who does what by when."}]'::jsonb,
 'built_in', false, false, ARRAY['team', 'standup', 'sync', 'sprint', 'retro', 'review']),

-- e) Candidate interview
(NULL, 'Candidate interview', 'Structured notes for hiring interviews',
 'Summarize this hiring interview. Be objective and note specific examples.',
 '[{"id":"background","title":"Candidate background","instruction":"Brief summary of who they are, their experience, and role they applied for."},{"id":"strengths","title":"Strengths","instruction":"What stood out positively? Include specific examples from the conversation."},{"id":"concerns","title":"Concerns","instruction":"Any red flags, gaps, or areas of uncertainty."},{"id":"culture","title":"Culture fit","instruction":"How well do they seem to fit the team and company values?"},{"id":"verdict","title":"Verdict","instruction":"Recommend: Strong yes / Yes / No / Strong no — and explain why."}]'::jsonb,
 'built_in', false, false, ARRAY['interview', 'candidate', 'hiring', 'hr', 'screening']),

-- f) Sales — Discovery (locked)
(NULL, 'Sales — Discovery', 'Advanced discovery with competitive and champion mapping',
 'Analyze this discovery call. Map the competitive landscape, identify the champion, and assess deal viability.',
 '[{"id":"pain_points","title":"Pain points","instruction":"What specific problems did the prospect describe?"},{"id":"current_solution","title":"Current solution","instruction":"What are they using today? What do they like/dislike about it?"},{"id":"competition","title":"Competitive landscape","instruction":"Did they mention evaluating other solutions? Which ones?"},{"id":"champion","title":"Champion / sponsor","instruction":"Who is the internal advocate? How much influence do they have?"},{"id":"next_steps","title":"Next steps","instruction":"What are the agreed next steps and timeline?"}]'::jsonb,
 'built_in', true, false, ARRAY['discovery']),

-- g) User research (locked)
(NULL, 'User research', 'Product discovery and user interview insights',
 'Analyze this user research interview. Focus on insights that can inform product decisions.',
 '[{"id":"context","title":"User context","instruction":"Who is the user? What is their role and how do they use the product?"},{"id":"quotes","title":"Key quotes","instruction":"Direct quotes that capture important sentiments or needs."},{"id":"insights","title":"Insights","instruction":"What did we learn that we did not know before?"},{"id":"opportunities","title":"Opportunities","instruction":"What product improvements or new features does this suggest?"}]'::jsonb,
 'built_in', true, false, ARRAY['research', 'user interview']),

-- h) Team standup (locked)
(NULL, 'Team standup', 'Daily standup: what happened, what''s next, blockers',
 'Summarize this daily standup. Keep it brief and actionable.',
 '[{"id":"yesterday","title":"What happened","instruction":"What did each person accomplish since last standup?"},{"id":"today","title":"What is next","instruction":"What is each person working on today?"},{"id":"blockers","title":"Blockers","instruction":"What is blocking progress? Who needs help?"}]'::jsonb,
 'built_in', true, false, ARRAY['standup', 'daily']);

-- 5. Add template_id to transcriptions table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transcriptions') THEN
    ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES templates(id) ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'transcriptions table does not exist — skipping template_id column addition';
  END IF;
END
$$;

-- 6. Create increment function
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid uuid)
RETURNS void AS $$
  UPDATE templates SET usage_count = usage_count + 1 WHERE id = template_uuid;
$$ LANGUAGE sql SECURITY DEFINER;
