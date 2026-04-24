-- =============================================================================
-- Reseed built-in templates with the full Notta-style library
-- -----------------------------------------------------------------------------
-- Removes the 8 original built-ins and replaces them with 32 templates
-- organized across 11 categories (Basic, Sales, HR & Management,
-- IT & Engineering, Consulting, Marketing, Medical, Education, Writer,
-- Media & Podcasts, Others).
--
-- Safe to run: transcriptions.template_id is ON DELETE SET NULL, so deleting
-- built-ins nulls out references rather than deleting transcriptions.
-- =============================================================================

BEGIN;

-- Drop existing built-ins (user_id IS NULL by construction).
DELETE FROM templates WHERE type = 'built_in';

INSERT INTO templates (user_id, name, description, instructions, sections, type, is_locked, is_default, auto_assign_keywords) VALUES

-- =============================================================================
-- BASIC (5)
-- =============================================================================

(NULL, 'Auto', 'Auto-adjusts the structure based on the meeting type and content.',
 NULL,
 '[{"id":"prompt","title":"Prompt","instruction":"Auto supplement details based on meeting information."}]'::jsonb,
 'built_in', false, true, ARRAY['auto']),

(NULL, 'General', 'Versatile, fundamental format suitable for any meeting.',
 NULL,
 '[{"id":"summary","title":"Summary","instruction":"Summarize the topics, decisions, key points, and important numerical data like volume, usage, and price."},
   {"id":"chapters","title":"Chapters","instruction":"Key details from each sub-chapter, with headlines for overviews and brief descriptions for main points."},
   {"id":"action_items","title":"Action Items","instruction":"Next actions and timeline."}]'::jsonb,
 'built_in', false, false, ARRAY['general']),

(NULL, 'Interview', 'General-purpose interview notes with summary, Q&A, and actions.',
 NULL,
 '[{"id":"summary","title":"Summary","instruction":"A summary of the conversation, including topics discussed and decisions made."},
   {"id":"qa","title":"Q&A","instruction":"Summarize the topics discussed in bullet points."},
   {"id":"action_items","title":"Action Items","instruction":"Next actions and timeline."}]'::jsonb,
 'built_in', false, false, ARRAY['interview']),

(NULL, 'Team Meeting', 'Team sync covering topics, review, progress, issues, and decisions.',
 NULL,
 '[{"id":"topics","title":"Topics","instruction":"Summarize the topics discussed in bullet points."},
   {"id":"review","title":"Review","instruction":"The retrospective discussion held on the performance of the previous period, project, or specific tasks."},
   {"id":"progress","title":"Progress","instruction":"Detailed records of the progress and issues discussed during the meeting, including updates on projects and tasks."},
   {"id":"issues","title":"Issues","instruction":"Issues discussed in the meeting, along with corresponding solutions and assigned personnel."},
   {"id":"decisions","title":"Decisions","instruction":"Key decisions made in the meeting, the reasons for each decision, and the next steps."}]'::jsonb,
 'built_in', false, false, ARRAY['team meeting', 'team sync']),

(NULL, 'Brainstorming', 'Structured brainstorm: objective, ground rules, ideas, actions.',
 NULL,
 '[{"id":"objective","title":"Objective","instruction":"The purpose or goal of the brainstorming session."},
   {"id":"ground_rules","title":"Ground Rules","instruction":"Ground rules for the brainstorming session."},
   {"id":"ideas","title":"Ideas","instruction":"Output of the brainstorming process, including all ideas, suggestions, and concepts proposed by participants."},
   {"id":"action_items","title":"Action Items","instruction":"Next actions and timeline."}]'::jsonb,
 'built_in', false, false, ARRAY['brainstorm', 'brainstorming']),

-- =============================================================================
-- SALES (9)
-- =============================================================================

(NULL, 'Sales Pitch', 'Structured sales pitch — theme, insights, proposal, response, budget, timeline.',
 NULL,
 '[{"id":"theme","title":"Theme","instruction":"Summary of the meeting topic."},
   {"id":"prospect_insights","title":"Prospect Insights","instruction":"Prospect''s concerns and needs."},
   {"id":"sales_proposal","title":"Sales Proposal","instruction":"Proposed solutions or services."},
   {"id":"prospect_response","title":"Prospect Response","instruction":"Prospect''s initial thoughts and feelings about the presented proposal."},
   {"id":"budget","title":"Budget","instruction":"Prospect''s budget range."},
   {"id":"implementation_timeline","title":"Implementation Timeline","instruction":"Desired timeline for product/service implementation."},
   {"id":"competitor_information","title":"Competitor Information","instruction":"Prospect''s comments on competitors and products."},
   {"id":"decisions","title":"Decisions","instruction":"Key decisions made during the meeting."},
   {"id":"action_items","title":"Action Items","instruction":"Next actions and timeline."}]'::jsonb,
 'built_in', false, false, ARRAY['sales pitch', 'pitch']),

(NULL, 'CHAMP', 'Challenges, Authority, Money, Prioritization — modern sales qualification.',
 NULL,
 '[{"id":"challenges","title":"Challenges","instruction":"The challenges and problems faced by the prospect."},
   {"id":"authority","title":"Authority","instruction":"The person within the organization who has the final approval authority."},
   {"id":"money","title":"Money","instruction":"The budget that has been secured."},
   {"id":"prioritization","title":"Prioritization","instruction":"The level of priority the prospect places on the product/solution they are seeking."}]'::jsonb,
 'built_in', false, false, ARRAY['champ']),

(NULL, 'ANUM', 'Authority, Need, Urgency, Money — decision-maker-first qualification.',
 NULL,
 '[{"id":"authority","title":"Authority","instruction":"Key decision-makers and influencers within the prospect''s organization."},
   {"id":"need","title":"Need","instruction":"The prospect''s specific needs or pain points."},
   {"id":"urgency","title":"Urgency","instruction":"Level of urgency for addressing the prospect''s needs."},
   {"id":"money","title":"Money","instruction":"The prospect''s budget and financial capacity."}]'::jsonb,
 'built_in', false, false, ARRAY['anum']),

(NULL, 'SPICED', 'Situation, Pain, Impact, Critical Event, Decision — outcome-focused framework.',
 NULL,
 '[{"id":"situation","title":"Situation","instruction":"Current situation or context of the sales opportunity."},
   {"id":"pain","title":"Pain","instruction":"Pain points or challenges faced by the prospect."},
   {"id":"impact","title":"Impact","instruction":"Impact these pain points have on the customer''s business."},
   {"id":"critical_event","title":"Critical Event","instruction":"When and why the customer needs to address these issues."},
   {"id":"decision","title":"Decision","instruction":"Criteria and priorities the customer uses to make a purchasing decision."}]'::jsonb,
 'built_in', false, false, ARRAY['spiced']),

(NULL, 'BANT', 'Budget, Authority, Needs, Timeline — classic sales qualification.',
 NULL,
 '[{"id":"budget","title":"Budget","instruction":"Allocated budget for the project or purchase."},
   {"id":"authority","title":"Authority","instruction":"Key decision-makers and their roles in the purchasing process."},
   {"id":"needs","title":"Needs","instruction":"Specific pain points and requirements of the customer."},
   {"id":"timeline","title":"Timeline","instruction":"Expected timeframe for implementation or purchase."}]'::jsonb,
 'built_in', false, false, ARRAY['bant']),

(NULL, 'GPCT', 'Goals, Plans, Challenges, Timeline — goal-oriented qualification.',
 NULL,
 '[{"id":"goals","title":"Goals","instruction":"The prospect''s primary business goals."},
   {"id":"plans","title":"Plans","instruction":"Strategies or plans the prospect has in place to achieve their goals."},
   {"id":"challenges","title":"Challenges","instruction":"Obstacles or challenges that might prevent the prospect from achieving their goals."},
   {"id":"timeline","title":"Timeline","instruction":"Timeframe within which the prospect expects to achieve their goals."}]'::jsonb,
 'built_in', false, false, ARRAY['gpct']),

(NULL, 'MEDDIC', 'Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion.',
 NULL,
 '[{"id":"metrics","title":"Metrics","instruction":"Quantifiable goals or key performance indicators that the customer aims to achieve."},
   {"id":"economic_buyer","title":"Economic Buyer","instruction":"The ultimate decision-maker with financial authority in the purchase process."},
   {"id":"decision_criteria","title":"Decision Criteria","instruction":"Key factors and standards the customer uses to evaluate potential solutions."},
   {"id":"decision_process","title":"Decision Process","instruction":"Overview of the decision-making process."},
   {"id":"identify_pain","title":"Identify Pain","instruction":"Critical business issues and pain points that the solution needs to address."},
   {"id":"champion","title":"Champion","instruction":"Internal advocate within the customer''s organization who supports the solution."}]'::jsonb,
 'built_in', false, false, ARRAY['meddic']),

(NULL, 'FAINT', 'Funds, Authority, Interest, Needs, Timing.',
 NULL,
 '[{"id":"funds","title":"Funds","instruction":"Observations on budget discussion."},
   {"id":"authority","title":"Authority","instruction":"Observations on customer''s authority."},
   {"id":"interest","title":"Interest","instruction":"Observations on customer''s interest level."},
   {"id":"needs","title":"Needs","instruction":"Observations on customer''s needs."},
   {"id":"timing","title":"Timing","instruction":"Observations on timeline discussed."}]'::jsonb,
 'built_in', false, false, ARRAY['faint']),

(NULL, 'SPIN', 'Situation, Problem, Implication, Need-payoff — consultative selling.',
 NULL,
 '[{"id":"situation","title":"Situation","instruction":"Summary of the customer''s current situation."},
   {"id":"problem","title":"Problem","instruction":"Key challenges or pain points faced by the customer that hinder their objectives."},
   {"id":"implication","title":"Implication","instruction":"Potential impact and negative consequences if the identified challenges are not addressed."},
   {"id":"need_payoff","title":"Need-payoff","instruction":"Benefits of addressing the customer''s challenges through the proposed solution and how it aligns with their goals."}]'::jsonb,
 'built_in', false, false, ARRAY['spin']),

-- =============================================================================
-- HR & MANAGEMENT (3)
-- =============================================================================

(NULL, 'Job Interview', 'Candidate background, skills, motivations, and next steps.',
 NULL,
 '[{"id":"background","title":"Candidate Background","instruction":"The candidate''s background."},
   {"id":"work_experience","title":"Work Experience","instruction":"The candidate''s key work experiences and qualifications."},
   {"id":"motivation","title":"Motivation to Apply","instruction":"The reason why the candidate is interested in this job opportunity."},
   {"id":"relevant_skills","title":"Relevant Skills","instruction":"The candidate''s main skills and competencies relevant to the position."},
   {"id":"personal_strengths","title":"Personal Strengths","instruction":"The candidate''s personal strengths or attributes mentioned during the interview."},
   {"id":"career_goals","title":"Long-Term Career Goals","instruction":"The candidate''s expressed career goals or aspirations in bullet points."},
   {"id":"candidate_questions","title":"Candidate''s Questions","instruction":"Significant questions or concerns raised by the candidate during the interview."},
   {"id":"next_steps","title":"Next steps","instruction":"Agreed-upon next steps or actions following the interview."}]'::jsonb,
 'built_in', false, false, ARRAY['job interview', 'candidate', 'hiring']),

(NULL, '1-on-1 Meeting', 'Manager/report 1:1 — progress, wins, blockers, action items, feedback.',
 NULL,
 '[{"id":"icebreakers","title":"Icebreakers","instruction":"Casual conversation or topics discussed to build rapport."},
   {"id":"progress","title":"Progress","instruction":"The employee''s recent progress on tasks, projects, or goals."},
   {"id":"whats_working","title":"What''s working well","instruction":"Areas where the employee''s performance or strategies are showing success."},
   {"id":"whats_not_working","title":"What''s not working well","instruction":"Areas where the employee is facing challenges or needs improvement."},
   {"id":"action_items","title":"Action Items","instruction":"Actionable steps or tasks for the employee to address areas of improvement or to work toward future goals."},
   {"id":"feedback","title":"Feedback for Manager/Company","instruction":"The employee''s feedback or suggestions for their manager or the company."}]'::jsonb,
 'built_in', false, false, ARRAY['1-on-1', '1:1', 'one-on-one']),

(NULL, 'Exit Interview', 'Departing employee — reasons, feedback, suggestions, future plans.',
 NULL,
 '[{"id":"reasons","title":"Reasons for Leaving","instruction":"Key reasons the employee is choosing to leave the company."},
   {"id":"positives","title":"Positive Aspects of the Company","instruction":"Positive aspects of the company mentioned by the employee."},
   {"id":"improvement","title":"Areas for Improvement","instruction":"Areas where the employee thinks the company could improve."},
   {"id":"leadership_feedback","title":"Feedback on Leadership","instruction":"Employee''s feedback on their direct supervisor and the company''s leadership, including any specific examples or suggestions."},
   {"id":"suggestions","title":"Suggestions for the Company","instruction":"Suggestions or recommendations the employee has for the company."},
   {"id":"future_plans","title":"Future plans","instruction":"Employee''s future career plans, if shared."},
   {"id":"willingness_to_stay","title":"Willingness to Stay","instruction":"Whether the employee would consider staying under certain conditions or is open to reconsidering their decision to leave."}]'::jsonb,
 'built_in', false, false, ARRAY['exit interview', 'offboarding']),

-- =============================================================================
-- IT & ENGINEERING (5)
-- =============================================================================

(NULL, 'User Research Session', 'Deep user research notes — background, pain points, goals, usage, feedback.',
 NULL,
 '[{"id":"user_background","title":"User Background","instruction":"User''s personal and professional background, including job responsibilities and industry experience."},
   {"id":"pain_points","title":"Problems and pain points","instruction":"Major challenges and shortcomings of existing solutions."},
   {"id":"goals_expectations","title":"Goals and expectations","instruction":"User goals and expectations for ideal features."},
   {"id":"usage_scenarios","title":"Usage scenarios","instruction":"Product fit in user''s workflow, including frequency and duration of use."},
   {"id":"feature_evaluation","title":"Feature evaluation","instruction":"Most valuable, missing, or unnecessary features."},
   {"id":"user_experience","title":"User experience","instruction":"User feedback on interface and interaction, including ease of use and challenges."},
   {"id":"decision_making","title":"Decision-making process","instruction":"How users discovered and selected the product."},
   {"id":"value_perception","title":"Value perception","instruction":"Product value and ROI assessment by users."},
   {"id":"support","title":"Customer support and service","instruction":"Support services used and satisfaction level."},
   {"id":"improvements","title":"Improvement suggestions","instruction":"Desired improvements or new features."},
   {"id":"industry_trends","title":"Industry trends and competitor awareness","instruction":"User views on industry trends and competitor comparison."},
   {"id":"recommendations","title":"Recommendations and word-of-mouth","instruction":"User recommendations and reasons."}]'::jsonb,
 'built_in', false, false, ARRAY['user research', 'user interview']),

(NULL, 'Daily Stand-up Meeting', 'Daily sync — yesterday, today, issues, progress, risks, help.',
 NULL,
 '[{"id":"yesterday","title":"What was completed yesterday","instruction":"Tasks or goals accomplished yesterday."},
   {"id":"today","title":"What is planned for today","instruction":"Tasks or goals planned for today."},
   {"id":"issues","title":"Issues","instruction":"Summarize any challenges or issues that are currently affecting the progress."},
   {"id":"progress","title":"Progress","instruction":"Current status of ongoing tasks or projects."},
   {"id":"risks","title":"Risks","instruction":"Potential risks that could impact the project''s timeline or success."},
   {"id":"help","title":"Help needed","instruction":"Assistance or resources required to overcome challenges or meet deadlines."}]'::jsonb,
 'built_in', false, false, ARRAY['standup', 'stand-up', 'daily']),

(NULL, 'Weekly Meeting', 'Weekly project sync — progress, plans, challenges, quality, requirements.',
 NULL,
 '[{"id":"progress_review","title":"Project Progress Review","instruction":"Tasks completed last week and comparison to the plan."},
   {"id":"next_week","title":"Next Week''s Work Plan","instruction":"Tasks planned for next week and any adjustments to priorities."},
   {"id":"technical_challenges","title":"Technical Challenges Discussion","instruction":"Current technical challenges and potential solutions."},
   {"id":"code_quality","title":"Code Quality and Testing","instruction":"Status of code reviews and progress in automated testing."},
   {"id":"requirements","title":"Product Requirements Update","instruction":"New user feedback or updates to product requirements."}]'::jsonb,
 'built_in', false, false, ARRAY['weekly meeting', 'weekly sync']),

(NULL, 'Sprint Planning', 'Backlog, pending tasks, capacity, sprint scope, open questions.',
 NULL,
 '[{"id":"backlog","title":"Backlog Review","instruction":"Prioritized items from the backlog that need to be planned for the upcoming sprint."},
   {"id":"pending","title":"Pending Tasks from Previous Sprint","instruction":"Tasks carried over from the previous sprint that need to be completed."},
   {"id":"capacity","title":"Capacity Assessment","instruction":"The team''s capacity for the upcoming sprint, including any limitations."},
   {"id":"tasks","title":"Tasks For This Sprint","instruction":"Specific tasks or user stories to be worked on during this sprint."},
   {"id":"open_questions","title":"Open Questions","instruction":"Open questions, doubts, or unresolved issues that need to be addressed during this sprint."},
   {"id":"problems","title":"Problems","instruction":"Challenges or blockers that could hinder the team''s progress during the sprint."}]'::jsonb,
 'built_in', false, false, ARRAY['sprint planning', 'sprint', 'planning poker']),

(NULL, 'Kick-off Meeting', 'Project kick-off — overview, team, timeline, risks, tools, success, Q&A.',
 NULL,
 '[{"id":"overview","title":"Project Overview","instruction":"A brief summary of the project, including its goals and objectives."},
   {"id":"team","title":"Team Introduction","instruction":"Key team members and their roles in the project."},
   {"id":"timeline","title":"Timeline and Milestones","instruction":"Project timeline with key milestones and deadlines highlighted."},
   {"id":"risks","title":"Risk Assessment","instruction":"Potential risks and list mitigation strategies."},
   {"id":"tools","title":"Tools and Resources","instruction":"Tools, technologies, and resources required for the project."},
   {"id":"success","title":"Success Criteria","instruction":"Criteria for measuring the project''s success."},
   {"id":"next_steps","title":"Next Steps","instruction":"Action plans decided during the conversation and the initial tasks assigned."},
   {"id":"qa","title":"Q&A Session","instruction":"Important questions raised during the conversation and their answers."}]'::jsonb,
 'built_in', false, false, ARRAY['kick-off', 'kickoff', 'project kickoff']),

-- =============================================================================
-- CONSULTING (1)
-- =============================================================================

(NULL, 'Consulting Meeting', 'Client consultation — summary, issues, solutions, Q&A, actions.',
 NULL,
 '[{"id":"summary","title":"Summary","instruction":"A summary of the meeting content, including topics discussed and decisions made."},
   {"id":"issue","title":"Issue","instruction":"Please summary and list the problems mentioned in the consulting meeting."},
   {"id":"solution","title":"Solution","instruction":"Consultant''s solutions or proposals for the client''s issues."},
   {"id":"qa","title":"Q&A","instruction":"Client questions and consultant responses."},
   {"id":"action_items","title":"Action items","instruction":"Outline key action plans with the subject, next action, and timeline in plain text, each on a new line."}]'::jsonb,
 'built_in', false, false, ARRAY['consulting', 'client meeting']),

-- =============================================================================
-- MARKETING (1)
-- =============================================================================

(NULL, 'GTM (Go-to-Market)', 'Go-to-market strategy — analysis, positioning, plan, timeline, budget.',
 NULL,
 '[{"id":"market_analysis","title":"Market Analysis and Product Fit","instruction":"Key components of market analysis and product fit."},
   {"id":"positioning","title":"Positioning and Messaging","instruction":"Essential elements of positioning and messaging."},
   {"id":"gtm_strategy","title":"Go-to-Market Strategy","instruction":"Main aspects of a go-to-market strategy."},
   {"id":"marketing_sales","title":"Marketing and Sales Plan","instruction":"Key components of a marketing and sales plan."},
   {"id":"launch_timeline","title":"Launch Timeline and Milestones","instruction":"Inclusions in launch timeline and milestones."},
   {"id":"budget","title":"Budget and Resource Allocation","instruction":"Main considerations for budget and resource allocation."}]'::jsonb,
 'built_in', false, false, ARRAY['gtm', 'go-to-market', 'launch']),

-- =============================================================================
-- MEDICAL (2)
-- =============================================================================

(NULL, 'SOAP Note', 'Subjective, Objective, Assessment, Plan — clinical notes.',
 NULL,
 '[{"id":"subjective","title":"Subjective","instruction":"Patient-reported symptoms, feelings, and concerns, including descriptions of pain, discomfort, or other subjective experiences."},
   {"id":"objective","title":"Objective","instruction":"Objective findings such as vital signs, physical exam results, lab data, or other measurable information."},
   {"id":"assessment","title":"Assessment","instruction":"Clinical assessment based on subjective and objective information, including diagnosis, differential diagnoses, or clinical impressions."},
   {"id":"plan","title":"Plan","instruction":"Patient care plan, including tests, treatments, follow-up appointments, and patient instructions, addressing issues from assessment."}]'::jsonb,
 'built_in', false, false, ARRAY['soap', 'soap note']),

(NULL, 'Medical Referral Letter', 'Structured referral letter with patient, diagnosis, history, and prescriptions.',
 NULL,
 '[{"id":"date","title":"Date of Referral","instruction":"Referral issuance date (Japanese era or Gregorian calendar)."},
   {"id":"destination","title":"Referral Destination Information","instruction":"Name of the receiving hospital or clinic, department name, physician''s name (use \"To the attending physician\" if unknown), and address."},
   {"id":"referring_doctor","title":"Referring Doctor''s Information","instruction":"Full name of the referring physician, title or department, and signature or official seal if required."},
   {"id":"referring_institution","title":"Referring Institution Information","instruction":"Name, address, and telephone number of the referring medical institution."},
   {"id":"patient","title":"Patient Information","instruction":"Full name, gender, date of birth and age, address, phone number, and occupation."},
   {"id":"diagnosis","title":"Diagnosis","instruction":"Primary diagnosis and up to three secondary conditions."},
   {"id":"purpose","title":"Purpose of Referral","instruction":"Reason for referral such as further examination, continued treatment, follow-up, or test result reporting."},
   {"id":"history","title":"Medical and Family History","instruction":"Relevant past medical history and family disease history."},
   {"id":"progression","title":"Symptom Progression and Test Results","instruction":"Chief complaints, physical findings, test content and results, clinical course; include attachments if applicable."},
   {"id":"treatment_history","title":"Treatment History","instruction":"Summary of treatment provided to date and clinical response."},
   {"id":"prescriptions","title":"Current Prescriptions","instruction":"Medication list including name, dosage, usage instructions, and known drug allergies."},
   {"id":"remarks","title":"Remarks","instruction":"Additional notes for the receiving physician."}]'::jsonb,
 'built_in', false, false, ARRAY['referral letter', 'medical referral']),

-- =============================================================================
-- EDUCATION (2)
-- =============================================================================

(NULL, 'Lecture', 'Lecture notes — overview, chapters, Q&A.',
 NULL,
 '[{"id":"summary","title":"Summary","instruction":"Overview of the lecture."},
   {"id":"chapters","title":"Chapters","instruction":"Key details from each sub-chapter, with headlines for overviews and brief descriptions for main points."},
   {"id":"qa","title":"Q&A","instruction":"Summary of student queries and teacher responses."}]'::jsonb,
 'built_in', false, false, ARRAY['lecture', 'class']),

(NULL, 'Panel Discussion', 'Panel — themes, perspectives, challenges, solutions, recommendations.',
 NULL,
 '[{"id":"themes","title":"Key Themes","instruction":"Summary of main themes identified in the discussion."},
   {"id":"educator","title":"Educator Perspectives","instruction":"Analysis of educators'' viewpoints and concerns."},
   {"id":"student","title":"Student Perspectives","instruction":"Analysis of students'' viewpoints and concerns."},
   {"id":"challenges","title":"Educational Challenges","instruction":"Identified challenges in education from the discussion."},
   {"id":"solutions","title":"Proposed Solutions","instruction":"Summary of solutions or improvements suggested."},
   {"id":"recommendations","title":"Recommendations","instruction":"Key recommendations based on the analysis."}]'::jsonb,
 'built_in', false, false, ARRAY['panel discussion', 'panel']),

-- =============================================================================
-- WRITER (2)
-- =============================================================================

(NULL, 'Reader Meet-and-Greet', 'Author-reader event — background, Q&A, discussion, writing experience.',
 NULL,
 '[{"id":"background","title":"Background","instruction":"Background information of the reader meet-and-greet event."},
   {"id":"qa","title":"Q&A","instruction":"Questions readers asked during the Q&A session."},
   {"id":"in_depth","title":"In-depth Discussion","instruction":"What aspects of the work are discussed in-depth?"},
   {"id":"writing_experience","title":"Writing Experience Sharing","instruction":"Content the author shared about their writing experience."},
   {"id":"authors_response","title":"Author''s Response","instruction":"Specific comments or answers provided by the author in response to the reader''s feedback."}]'::jsonb,
 'built_in', false, false, ARRAY['reader', 'meet-and-greet', 'meet and greet']),

(NULL, 'Interview Article', 'Interview piece — title, intro, profile, main content, conclusion, links.',
 NULL,
 '[{"id":"title","title":"Title","instruction":"A clear and engaging title reflecting the central theme of the interview."},
   {"id":"intro","title":"Introduction","instruction":"An overview of the interview''s background and context; key takeaways or unique aspects to capture the reader''s interest."},
   {"id":"profile","title":"Interviewee Profile","instruction":"The interviewee''s name, title, company, and notable achievements; a brief description of their expertise."},
   {"id":"main_content","title":"Main Content","instruction":"A structured presentation of the interview (Q&A Format, Narrative Format, or Thematic Format)."},
   {"id":"conclusion","title":"Conclusion","instruction":"A summary of the key points covered during the interview; forward-looking reflections or additional perspectives."},
   {"id":"related_links","title":"Related Links","instruction":"References to related articles, resources, or relevant materials for further exploration."}]'::jsonb,
 'built_in', false, false, ARRAY['interview article', 'article interview']),

-- =============================================================================
-- MEDIA & PODCASTS (1)
-- =============================================================================

(NULL, 'YouTube Video', 'Video summary and highlights.',
 NULL,
 '[{"id":"summary","title":"Summary","instruction":"Main content of the video."},
   {"id":"highlights","title":"Highlights","instruction":"Key points from the video."}]'::jsonb,
 'built_in', false, false, ARRAY['youtube', 'video summary']),

-- =============================================================================
-- OTHERS (1)
-- =============================================================================

(NULL, 'Board Meeting', 'Board meeting minutes — roll call, agenda, reports, motions, adjournment.',
 NULL,
 '[{"id":"meeting_title","title":"Meeting title","instruction":"Meeting title read by the chairman at the beginning."},
   {"id":"date_time_location","title":"Date, time and location","instruction":"Date, time, and location as announced by the chairman."},
   {"id":"roll_call","title":"Roll Call","instruction":"Attendees and absentees, called by name for confirmation."},
   {"id":"agenda","title":"Agenda Adjustments","instruction":"Agenda changes requested by the chairman."},
   {"id":"report","title":"Report","instruction":"Key updates grouped by reporters (notable committee members)."},
   {"id":"motion","title":"Motion, action and approval","instruction":"Please list the decisions made during board meetings, which typically include motions, actions, approvals, and disapprovals."},
   {"id":"adjournment","title":"Adjournment","instruction":"Formal conclusion of the meeting."}]'::jsonb,
 'built_in', false, false, ARRAY['board meeting', 'board']);

COMMIT;
