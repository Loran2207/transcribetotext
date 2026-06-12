import type { Template } from "@/lib/templates";

/* Sample content for the view-only template detail page.
   Each built-in template maps to a realistic demo recording (source) and
   pre-written section content showing what the template produces. */

export interface SampleSegment { speaker: string; time: string; text: string }

export interface SampleSource {
  title: string;
  meta: string;
  segments: SampleSegment[];
}

interface Scenario {
  source: SampleSource;
  /** lower-case section title -> content lines (rendered as bullets / paragraphs) */
  content: Record<string, string[]>;
}

const team: Scenario = {
  source: {
    title: "Weekly product sync - Q2 roadmap",
    meta: "32 min · Google Meet · Apr 2, 2026",
    segments: [
      { speaker: "Sarah Collins", time: "00:12", text: "Okay, let's run through the Q2 roadmap. The headline goal is shipping the new booking flow before the end of May." },
      { speaker: "Kirill Kuts", time: "03:48", text: "Design is ready for the first two screens. The blocker right now is the pricing API - we are still waiting on the contract from the platform team." },
      { speaker: "Alex Morgan", time: "11:25", text: "I can have the pricing endpoints stubbed by Friday so mobile is not blocked. The real integration lands next sprint." },
      { speaker: "James Lee", time: "24:02", text: "One risk to flag: the analytics migration overlaps with the booking work. If both slip we lose the May window." },
    ],
  },
  content: {
    "prompt": ["This recording is a weekly product sync. The structure below was auto-selected to match it: a short summary, key discussion points, and follow-ups."],
    "summary": ["The team aligned on the Q2 roadmap with the new booking flow as the headline deliverable for May. Design is ahead of schedule, but the pricing API contract is the main dependency. Analytics migration was flagged as a scheduling risk."],
    "chapters": ["00:00 - Q2 goals and headline deliverable", "08:30 - Booking flow design status", "15:40 - Pricing API dependency", "23:10 - Risks: analytics migration overlap"],
    "action items": ["Alex to stub pricing endpoints by Friday", "Sarah to confirm the May launch window with leadership", "James to publish the analytics migration timeline"],
    "topics": ["Q2 roadmap priorities", "Booking flow progress", "Pricing API dependency", "Analytics migration overlap"],
    "review": ["Booking flow designs approved for the first two screens", "Sprint 14 commitments delivered except the pricing contract"],
    "progress": ["Design: 2 of 5 booking screens finalized", "Engineering: checkout service scaffolded, pricing integration pending"],
    "issues": ["Pricing API contract still not delivered by the platform team", "Analytics migration competes for the same engineers in May"],
    "decisions": ["Ship the booking flow by end of May", "Stub pricing endpoints to unblock mobile this sprint"],
  },
};

const engWeekly: Scenario = {
  source: {
    title: "Weekly engineering sync - customer portal",
    meta: "38 min · Google Meet · Mar 31, 2026",
    segments: [
      { speaker: "James Lee", time: "00:20", text: "Portal milestone two is done - auth, dashboard shell, and the first reporting widget are all merged." },
      { speaker: "Alex Morgan", time: "09:05", text: "Flaky tests on the reporting suite are slowing reviews down. I want to quarantine them and fix the root cause next week." },
      { speaker: "Kirill Kuts", time: "21:44", text: "Product update from my side: the export requirement moved up - clients are asking for CSV downloads in the first release." },
    ],
  },
  content: {
    "project progress review": ["Milestone 2 complete: authentication, dashboard shell, first reporting widget", "Velocity steady at 28 points; review queue clearing within a day"],
    "next week's work plan": ["Start the CSV export service", "Quarantine and fix flaky reporting tests", "Begin accessibility audit of the dashboard"],
    "technical challenges discussion": ["Reporting test suite is flaky under parallel runs - root cause suspected in shared fixtures", "Widget data layer needs caching before more clients onboard"],
    "code quality and testing": ["Coverage at 81% overall; reporting module lowest at 64%", "Agreed to block merges on the quarantined suite once stabilized"],
    "product requirements update": ["CSV export moved into the first release scope after client requests", "Reporting filters deferred to milestone 4"],
  },
};

const standup: Scenario = {
  source: {
    title: "Daily standup - platform team",
    meta: "14 min · Google Meet · Apr 2, 2026",
    segments: [
      { speaker: "James Lee", time: "00:05", text: "Yesterday I finished the rate limiter rollout to staging. Today I'm starting on the webhook retries." },
      { speaker: "Kirill Kuts", time: "04:12", text: "I closed out the design review notes. Today is the booking flow handoff. No blockers." },
      { speaker: "Alex Morgan", time: "08:30", text: "Still stuck on the flaky CI runner - I could use a second pair of eyes after lunch." },
    ],
  },
  content: {
    "what was completed yesterday": ["Rate limiter rolled out to staging (James)", "Design review notes closed out (Kirill)", "Webhook payload schema finalized (Alex)"],
    "what is planned for today": ["Webhook retry logic implementation", "Booking flow design handoff", "CI runner investigation"],
    "issues": ["CI runner fails intermittently on the integration suite - third day in a row"],
    "progress": ["Sprint burndown on track: 60% of points done by day 6"],
    "risks": ["Webhook retries may slip if the CI issue keeps blocking merges"],
    "help needed": ["Alex needs a second pair of eyes on the flaky CI runner after lunch"],
  },
};

const sales: Scenario = {
  source: {
    title: "Sales discovery - Acme Logistics",
    meta: "41 min · Zoom · Apr 1, 2026",
    segments: [
      { speaker: "Dana Whitfield", time: "02:14", text: "Our dispatchers spend about two hours a day writing up call notes manually. It's the biggest time sink in the whole intake process." },
      { speaker: "Kirill Kuts", time: "10:32", text: "If transcription cut that to fifteen minutes, what would that mean across your team of forty dispatchers?" },
      { speaker: "Dana Whitfield", time: "18:50", text: "Honestly, that's the difference between hiring six more people this year or not. Budget-wise we have room in Q3 - final sign-off sits with our COO, Mark." },
      { speaker: "Dana Whitfield", time: "33:08", text: "We looked at two competitors last quarter. Accuracy on logistics jargon was the dealbreaker both times." },
    ],
  },
  content: {
    "theme": ["Automating call documentation for a 40-person dispatch team at Acme Logistics."],
    "prospect insights": ["Dispatchers lose ~2 hours/day to manual call notes", "Accuracy on logistics jargon killed two previous vendor evaluations"],
    "sales proposal": ["Team plan with custom vocabulary for logistics terms, rolled out to one dispatch pod first"],
    "prospect response": ["Strongly positive on time savings; wants accuracy proof on real call recordings before committing"],
    "budget": ["Room in the Q3 budget cycle; roughly the cost of one dispatcher hire", "No procurement freeze expected"],
    "implementation timeline": ["Pilot with one pod in July, full rollout by September if accuracy targets are met"],
    "competitor information": ["Two competitors evaluated last quarter - both failed on logistics jargon accuracy"],
    "decisions": ["Run a two-week pilot on recorded dispatch calls", "Schedule a demo for COO Mark Reeves next week"],
    "action items": ["Send pilot proposal and pricing by Thursday", "Prepare jargon-accuracy benchmark on Acme's sample calls"],
    "challenges": ["Manual call documentation consumes ~80 dispatcher-hours daily across the team", "Previous tools failed on domain-specific vocabulary"],
    "authority": ["Dana Whitfield owns the evaluation; final sign-off with COO Mark Reeves"],
    "money": ["Q3 budget available - comparable to one full-time hire; ROI framed against six avoided hires"],
    "prioritization": ["Top-three initiative for the ops org this year; tied to the Q3 hiring decision"],
    "need": ["Reduce note-writing time from 2 hours to minutes per dispatcher per day"],
    "needs": ["Accurate transcription of logistics jargon", "Team-wide rollout with role-based access", "Exportable summaries for the intake system"],
    "urgency": ["Hiring decision lands in Q3 - solution must be validated before then"],
    "situation": ["40 dispatchers document intake calls manually across three regional hubs"],
    "pain": ["2 hours per dispatcher per day lost to manual notes; error-prone handoffs between shifts"],
    "impact": ["~80 hours/day recovered across the team; avoids six planned hires (~$390K/year)"],
    "implication": ["Without automation, intake capacity caps out this year and overtime costs keep climbing"],
    "need-payoff": ["Automated summaries would let dispatchers handle 30% more calls without added headcount"],
    "critical event": ["Q3 budget sign-off meeting - decision needed before the hiring plan is finalized"],
    "decision": ["Proceed to a paid pilot pending the jargon-accuracy benchmark"],
    "metrics": ["Target: note time under 15 min/day per dispatcher; jargon accuracy above 95%"],
    "economic buyer": ["Mark Reeves, COO - controls the ops tooling budget"],
    "decision criteria": ["Jargon accuracy, rollout speed, per-seat cost vs. hiring"],
    "decision process": ["Pilot, then accuracy review with team leads, then COO sign-off in the Q3 budget meeting"],
    "identify pain": ["Documentation overhead is the single biggest drag on intake capacity"],
    "champion": ["Dana Whitfield, Head of Dispatch Operations - driving the evaluation internally"],
    "funds": ["Q3 ops tooling budget; amount earmarked roughly equals one dispatcher salary"],
    "interest": ["High - asked for pilot pricing unprompted and offered sample call recordings"],
    "timing": ["Pilot in July, decision by the September budget review"],
    "timeline": ["July pilot, August accuracy review, September rollout decision"],
    "goals": ["Cut documentation time by 85% and absorb seasonal call peaks without new hires"],
    "plans": ["Currently hiring to cover the gap; open to tooling if the pilot proves accuracy"],
    "problem": ["Manual notes are slow, inconsistent between dispatchers, and unsearchable"],
  },
};

const jobInterview: Scenario = {
  source: {
    title: "Interview - senior frontend engineer",
    meta: "48 min · Zoom · Mar 30, 2026",
    segments: [
      { speaker: "Elena Park", time: "01:40", text: "I've spent the last four years at a fintech startup leading the design-system effort - we took component coverage from 20% to 90%." },
      { speaker: "Alex Morgan", time: "15:22", text: "How would you approach migrating a legacy checkout flow without freezing feature work?" },
      { speaker: "Elena Park", time: "16:01", text: "Strangler pattern - wrap the legacy flow, route a small traffic slice to the new one, and expand as confidence grows." },
      { speaker: "Elena Park", time: "44:30", text: "What does success look like for this role in the first six months?" },
    ],
  },
  content: {
    "summary": ["Elena Park interviewed for the senior frontend role. Strong design-system background, clear migration strategy thinking, and good questions about success criteria. Recommended to advance to the system-design round."],
    "q&a": ["Q: How would you migrate a legacy checkout without freezing features? - A: Strangler pattern with incremental traffic shifting.", "Q: What does success look like in six months? - A: Discussed ownership of the booking flow redesign."],
    "action items": ["Schedule system-design round with James", "Collect structured feedback in the hiring doc by Friday"],
    "candidate background": ["4 years at a fintech startup; led design-system adoption from 20% to 90% component coverage", "Previously 3 years at an agency working on e-commerce frontends"],
    "work experience": ["Led a 5-person frontend guild; shipped a checkout rewrite that lifted conversion 8%", "Owns accessibility reviews and frontend hiring loops at current company"],
    "motivation to apply": ["Wants product ownership rather than platform-only work; drawn to the meeting-intelligence space"],
    "relevant skills": ["React, TypeScript, design systems, performance profiling", "Incremental migration strategies (strangler pattern)"],
    "personal strengths": ["Calm, structured reasoning under follow-up pressure; communicates trade-offs clearly"],
    "long-term career goals": ["Staff engineer track with continued hands-on coding; mentoring junior engineers"],
    "candidate's questions": ["Six-month success criteria for the role", "How design and engineering split ownership of the design system"],
    "next steps": ["System-design round next week, then a values interview with Sarah"],
  },
};

const oneOnOne: Scenario = {
  source: {
    title: "1:1 - Kirill & Alex",
    meta: "27 min · Google Meet · Apr 1, 2026",
    segments: [
      { speaker: "Alex Morgan", time: "00:30", text: "Good week overall - the rate limiter shipped clean. The part that's dragging is code review turnaround on the platform repos." },
      { speaker: "Kirill Kuts", time: "12:15", text: "What would unblock that - more reviewers, or smaller PRs as a team norm?" },
      { speaker: "Alex Morgan", time: "20:48", text: "Honestly, a rotation would help. Also, I'd like to take the conference talk slot in June if it's still open." },
    ],
  },
  content: {
    "icebreakers": ["Alex got back from a climbing trip - first 7a route completed"],
    "progress": ["Rate limiter shipped to production with zero incidents", "Mentoring of the new hire is going well; first solo PR merged"],
    "what's working well": ["Clear sprint scope; pairing sessions with James on infra"],
    "what's not working well": ["Code review turnaround on platform repos is 2+ days; context switching across three services"],
    "action items": ["Kirill to propose a review rotation at the next team meeting", "Alex to draft the June conference talk abstract"],
    "feedback for manager/company": ["More notice before roadmap changes; otherwise communication is solid"],
  },
};

const exitInterview: Scenario = {
  source: {
    title: "Exit interview - departing designer",
    meta: "35 min · Google Meet · Mar 27, 2026",
    segments: [
      { speaker: "Noah Fields", time: "02:05", text: "It's not one big thing. The work was good - I just hit a ceiling on growth here, and the new role is a design lead position." },
      { speaker: "Sarah Collins", time: "14:40", text: "If you could change one thing about how design works here, what would it be?" },
      { speaker: "Noah Fields", time: "15:12", text: "Bring design into discovery earlier. We often joined after the scope was already locked." },
    ],
  },
  content: {
    "reasons for leaving": ["Accepted a design-lead role elsewhere; growth ceiling on the current team"],
    "positive aspects of the company": ["Strong engineering partnership; honest feedback culture; flexible remote setup"],
    "areas for improvement": ["Design joins discovery too late - scope is often locked before design input"],
    "feedback on leadership": ["Direct manager supportive; wants clearer design representation at the leadership level"],
    "suggestions for the company": ["Create a design-lead career track; include design in quarterly planning from day one"],
    "future plans": ["Design lead at a healthtech startup starting in May"],
    "willingness to stay": ["Would have stayed for a lead role with discovery ownership; open to returning later"],
  },
};

const research: Scenario = {
  source: {
    title: "User research - booking flow",
    meta: "52 min · Zoom · Mar 31, 2026",
    segments: [
      { speaker: "Marcus Bell", time: "03:18", text: "I book about a dozen sessions a month. The part I dread is re-entering the same details every single time." },
      { speaker: "Anna Reyes", time: "20:05", text: "Walk me through the last time the process actually failed for you." },
      { speaker: "Marcus Bell", time: "20:40", text: "Last Tuesday - the confirmation never arrived, so I double-booked. I had to call support to untangle it." },
    ],
  },
  content: {
    "user background": ["Marcus Bell, operations coordinator; books ~12 sessions monthly for a 15-person team"],
    "problems and pain points": ["Repeated data entry on every booking", "Missing confirmations caused a double-booking last week"],
    "goals and expectations": ["One-click rebooking with saved details; reliable instant confirmations"],
    "usage scenarios": ["Weekly batch-booking on Monday mornings; ad-hoc reschedules from mobile"],
    "feature evaluation": ["Saved profiles rated must-have; calendar sync nice-to-have"],
    "user experience": ["Finds the current flow clear but repetitive; mobile layout cramped on the date picker"],
    "decision-making process": ["Recommends tools to his manager; team adopts whatever ops validates"],
    "value perception": ["Would pay for the time saved if confirmations are dependable"],
    "customer support and service": ["Support resolved the double-booking quickly, but the call took 25 minutes"],
    "improvement suggestions": ["Saved booking profiles, resend-confirmation button, calendar integration"],
    "industry trends and competitor awareness": ["Mentioned a competitor's one-click rebooking as the benchmark"],
    "recommendations and word-of-mouth": ["Would recommend after the confirmation issue is fixed; NPS today: 7"],
  },
};

const brainstorm: Scenario = {
  source: {
    title: "Brainstorm - onboarding activation ideas",
    meta: "38 min · Google Meet · Mar 30, 2026",
    segments: [
      { speaker: "Sarah Collins", time: "00:45", text: "The question on the table: how do we get new users to their first transcript in under five minutes?" },
      { speaker: "Priya Nair", time: "12:20", text: "What if the empty state itself was a demo recording they can play with - no upload needed?" },
      { speaker: "James Lee", time: "25:10", text: "We could also pre-fill a sample meeting from their calendar title. Cheap to build, very personal." },
    ],
  },
  content: {
    "objective": ["Get new users to their first transcript within five minutes of signup."],
    "ground rules": ["No idea rejected in round one; build on each other; vote at the end"],
    "ideas": ["Interactive demo recording in the empty state", "Pre-filled sample meeting from calendar titles", "Guided 3-step checklist with progress bar", "Email a sample transcript before first login"],
    "action items": ["Priya to mock the demo-recording empty state", "James to estimate calendar pre-fill effort", "Vote on top two ideas at Friday's sync"],
  },
};

const sprint: Scenario = {
  source: {
    title: "Sprint planning - mobile app (Sprint 15)",
    meta: "45 min · Google Meet · Mar 30, 2026",
    segments: [
      { speaker: "James Lee", time: "01:10", text: "Backlog top to bottom: offline playback, the share-sheet fix, and push-notification preferences." },
      { speaker: "Alex Morgan", time: "18:33", text: "Capacity check - we're down one engineer next week, so I'd cap the sprint at 24 points." },
      { speaker: "Kirill Kuts", time: "37:02", text: "Open question: do we ship offline playback behind a flag or straight to everyone?" },
    ],
  },
  content: {
    "backlog review": ["Offline playback (13 pts), share-sheet fix (5 pts), push preferences (8 pts) at the top of the backlog"],
    "pending tasks from previous sprint": ["Share-sheet fix carried over - blocked on an upstream SDK release that landed yesterday"],
    "capacity assessment": ["One engineer out next week; sprint capped at 24 points instead of the usual 30"],
    "tasks for this sprint": ["Offline playback behind a feature flag", "Finish the share-sheet fix", "Push-notification preferences screen"],
    "open questions": ["Flagged rollout vs. full release for offline playback - decision deferred to the QA results"],
    "problems": ["Device farm slots are booked solid Thursday-Friday; QA window is tight"],
  },
};

const kickoff: Scenario = {
  source: {
    title: "Kick-off - customer portal project",
    meta: "40 min · Zoom · Mar 27, 2026",
    segments: [
      { speaker: "Sarah Collins", time: "00:55", text: "This project gives our enterprise clients a self-serve portal: usage, billing, and team management in one place." },
      { speaker: "James Lee", time: "16:30", text: "Phase one is auth and the dashboard shell - six weeks. Reporting lands in phase two." },
      { speaker: "Alex Morgan", time: "28:14", text: "Main risk is the billing API: it's owned by another team and their roadmap is packed." },
    ],
  },
  content: {
    "project overview": ["Self-serve enterprise portal: usage analytics, billing, and team management in one place."],
    "team introduction": ["Sarah - product lead; James - tech lead; Alex - platform; Anna - design; two engineers joining in May"],
    "timeline and milestones": ["Phase 1 (6 weeks): auth + dashboard shell", "Phase 2 (4 weeks): reporting", "GA target: end of Q3"],
    "risk assessment": ["Billing API owned by another team with a packed roadmap", "Enterprise SSO requirements still being collected"],
    "tools and resources": ["Figma for design, Linear for tracking, staging env provisioned this week"],
    "success criteria": ["80% of enterprise accounts self-serve within two months of GA; support tickets on billing down 40%"],
    "next steps": ["Design kickoff Monday; API contract review with the billing team Wednesday"],
    "q&a session": ["Q: Will the portal replace the admin app? - A: Eventually; admin stays until feature parity."],
  },
};

const consulting: Scenario = {
  source: {
    title: "Consultation - logistics workflow audit",
    meta: "50 min · Zoom · Mar 31, 2026",
    segments: [
      { speaker: "Dana Whitfield", time: "04:22", text: "Intake is the bottleneck. Calls pile up Monday mornings and notes get sloppy by the afternoon shift." },
      { speaker: "Kirill Kuts", time: "22:10", text: "Two quick wins: templated call summaries for the intake team, and routing rules so Monday volume spreads across hubs." },
      { speaker: "Dana Whitfield", time: "41:30", text: "Let's start with the templates - that we can pilot without touching the routing system." },
    ],
  },
  content: {
    "summary": ["Workflow audit for Acme Logistics' intake process. Monday call spikes and inconsistent notes are the core issues; templated summaries chosen as the first intervention."],
    "issue": ["Call intake bottlenecks on Monday mornings; note quality degrades across shifts; no searchable history"],
    "solution": ["Templated call summaries for the intake team first; routing rules across hubs as phase two"],
    "q&a": ["Q: Can templates work with the existing CRM? - A: Yes, via the export integration.", "Q: Timeline for the pilot? - A: Two weeks from sign-off."],
    "action items": ["Draft summary template with the intake leads", "Set pilot success metrics (note time, error rate) by Friday"],
  },
};

const gtm: Scenario = {
  source: {
    title: "GTM planning - spring launch",
    meta: "55 min · Google Meet · Mar 26, 2026",
    segments: [
      { speaker: "Priya Nair", time: "02:40", text: "Positioning hinges on one line: meeting notes that write themselves - accurate enough for legal and sales teams." },
      { speaker: "Sarah Collins", time: "20:15", text: "Mid-market ops teams are the beachhead. Enterprise follows once the security page and SOC 2 messaging are live." },
      { speaker: "Priya Nair", time: "43:08", text: "Launch sequence: private beta in April, public launch May 12, partner webinars through June." },
    ],
  },
  content: {
    "market analysis and product fit": ["Mid-market ops teams (50-500 seats) show the strongest pull; accuracy on domain jargon is the wedge"],
    "positioning and messaging": ["Meeting notes that write themselves - accuracy-first positioning against generic recorders"],
    "go-to-market strategy": ["Beachhead: mid-market ops; expand to enterprise after SOC 2 messaging ships"],
    "marketing and sales plan": ["Lifecycle emails from beta list, two partner webinars, founder-led outbound to 100 target accounts"],
    "launch timeline and milestones": ["Private beta: April", "Public launch: May 12", "Partner webinar series: through June"],
    "budget and resource allocation": ["$60K launch budget: 50% paid acquisition, 30% content, 20% events"],
  },
};

const medical: Scenario = {
  source: {
    title: "Patient consult - follow-up visit",
    meta: "22 min · In-person · Mar 30, 2026",
    segments: [
      { speaker: "Dr. Robert Hale", time: "00:40", text: "How have the headaches been since we adjusted the dosage two weeks ago?" },
      { speaker: "Patient", time: "01:02", text: "Better - down to maybe twice a week, and the morning stiffness is mostly gone." },
      { speaker: "Dr. Robert Hale", time: "14:25", text: "Blood pressure is 124 over 78 today, which is right where we want it. Let's keep the current dose and recheck in six weeks." },
    ],
  },
  content: {
    "subjective": ["Headache frequency down from daily to ~2x/week since dosage adjustment; morning stiffness largely resolved; sleep improved"],
    "objective": ["BP 124/78, HR 72, afebrile; no focal neurological findings on exam"],
    "assessment": ["Hypertension responding well to adjusted therapy; tension-type headaches improving"],
    "plan": ["Continue current dose; recheck BP and review headache diary in six weeks; return sooner if symptoms worsen"],
    "date of referral": ["March 30, 2026"],
    "referral destination information": ["Northwind Neurology Clinic, Dr. S. Verma - headache specialty service"],
    "referring doctor's information": ["Dr. Robert Hale, Internal Medicine, license #84210"],
    "referring institution information": ["Northwind Family Health Center, 12 Harbor St."],
    "patient information": ["Patient, 46, established since 2021; contact details on file"],
    "diagnosis": ["Tension-type headaches, partially controlled; essential hypertension, controlled"],
    "purpose of referral": ["Specialist evaluation of persistent headaches despite improved BP control"],
    "medical and family history": ["Family history of migraine (mother); no prior neurological events"],
    "symptom progression and test results": ["Headaches improved from daily to twice weekly; recent labs within normal limits"],
    "treatment history": ["Lisinopril since 2024; dosage adjusted two weeks ago with good response"],
    "current prescriptions": ["Lisinopril 20 mg daily; ibuprofen PRN"],
    "remarks": ["Patient prefers morning appointments; interpreter not required"],
  },
};

const lecture: Scenario = {
  source: {
    title: "Guest lecture - intro to machine learning",
    meta: "74 min · Zoom · Mar 25, 2026",
    segments: [
      { speaker: "Prof. Lena Osei", time: "02:10", text: "Machine learning is, at its core, function approximation from examples - everything else is engineering around that idea." },
      { speaker: "Prof. Lena Osei", time: "35:48", text: "Overfitting is what happens when your model memorizes the textbook instead of learning the subject." },
      { speaker: "Student", time: "66:20", text: "How do you decide between a simple model and a deep network in practice?" },
    ],
  },
  content: {
    "summary": ["An introductory lecture framing machine learning as function approximation from examples, covering supervised learning, overfitting and regularization, and practical model selection."],
    "chapters": ["00:00 - What ML actually is", "18:30 - Supervised learning walkthrough", "35:00 - Overfitting and regularization", "55:00 - Choosing models in practice", "65:00 - Student Q&A"],
    "q&a": ["Q: Simple model vs. deep network? - A: Start simple; complexity must earn its keep on validation data.", "Q: Best first project? - A: A small end-to-end pipeline on data you personally care about."],
  },
};

const panel: Scenario = {
  source: {
    title: "Panel - the future of remote education",
    meta: "62 min · Zoom · Mar 24, 2026",
    segments: [
      { speaker: "Moderator", time: "01:30", text: "Three years after the big shift online - what actually stuck?" },
      { speaker: "Dr. Imani Cole", time: "12:05", text: "Hybrid office hours stuck. Students who never came to campus office hours show up online." },
      { speaker: "Tomas Rivera (student)", time: "30:42", text: "What didn't stick is engagement - recorded lectures without interaction are just podcasts with homework." },
    ],
  },
  content: {
    "key themes": ["What survived the shift to remote learning", "Engagement vs. flexibility trade-offs", "Assessment integrity online"],
    "educator perspectives": ["Hybrid office hours increased participation", "Grading workload rose with asynchronous formats"],
    "student perspectives": ["Flexibility is valued, but passive recorded lectures kill engagement", "Group work online still feels harder than in person"],
    "educational challenges": ["Keeping interaction alive at scale; equitable access to reliable internet"],
    "proposed solutions": ["Flipped classrooms with live discussion blocks; lightweight live polls; smaller breakout cohorts"],
    "recommendations": ["Default to hybrid office hours; cap recorded-only courses; invest in interactive tooling"],
  },
};

const writer: Scenario = {
  source: {
    title: "Reader meet-and-greet - debut novel",
    meta: "58 min · In-person · Mar 22, 2026",
    segments: [
      { speaker: "Naomi Hart", time: "03:15", text: "The book started as a short story I couldn't let go of - the harbor town kept growing every time I came back to it." },
      { speaker: "Reader", time: "24:40", text: "The lighthouse keeper's chapters feel so lived-in. How much research went into them?" },
      { speaker: "Naomi Hart", time: "25:02", text: "Two weeks living next to a working lighthouse, and about forty cups of tea with its keeper." },
    ],
  },
  content: {
    "background": ["Naomi Hart's debut novel grew from an unshakeable short story; published this spring after three years of writing"],
    "q&a": ["Q: How much research for the lighthouse chapters? - A: Two weeks beside a working lighthouse and long talks with its keeper.", "Q: Next book? - A: Same coastline, different century."],
    "in-depth discussion": ["The harbor town as a character; balancing research detail against pacing; writing grief without melodrama"],
    "writing experience sharing": ["Drafts longhand in the morning, edits digitally at night; reads every chapter aloud before calling it done"],
    "author's response": ["Grateful for readers connecting with the quieter chapters; confirmed a sequel set on the same coastline"],
    "title": ["The Keeper of Gull Harbor - a conversation with Naomi Hart"],
    "introduction": ["At a packed independent bookstore, debut novelist Naomi Hart spoke about lighthouses, longhand drafts, and the town that wouldn't leave her alone."],
    "interviewee profile": ["Naomi Hart, debut novelist; former maritime journalist; lives on the northern coast"],
    "main content": ["Hart traced the novel's origin from short story to 400-page saga, described her lighthouse research, and read an unpublished epilogue."],
    "conclusion": ["A sequel on the same coastline is underway; Hart returns for the summer festival circuit."],
    "related links": ["Publisher's page for the novel", "Festival appearance schedule", "The original short story (online archive)"],
  },
};

const media: Scenario = {
  source: {
    title: "YouTube - product walkthrough video",
    meta: "18 min · Uploaded video · Apr 1, 2026",
    segments: [
      { speaker: "Host", time: "00:25", text: "Today I'm testing this AI meeting tool on a real client call - no edits, you'll see exactly what it produces." },
      { speaker: "Host", time: "09:10", text: "The action-items section caught two follow-ups I completely missed during the call itself." },
      { speaker: "Host", time: "16:40", text: "Verdict: the transcript accuracy is the headline - the summary quality depends a lot on which template you pick." },
    ],
  },
  content: {
    "summary": ["A hands-on walkthrough testing the product on a real client call: transcript accuracy impresses, action-item detection catches missed follow-ups, and template choice drives summary quality."],
    "highlights": ["02:10 - Live transcription demo on a real call", "09:10 - Action items caught two missed follow-ups", "14:30 - Template comparison side by side", "16:40 - Final verdict and recommendations"],
  },
};

const board: Scenario = {
  source: {
    title: "Q1 board meeting - Northwind Labs",
    meta: "88 min · Zoom · Mar 28, 2026",
    segments: [
      { speaker: "Chair", time: "00:50", text: "Calling the Q1 meeting to order - all five directors present, plus counsel as observer." },
      { speaker: "Sarah Collins", time: "25:30", text: "Revenue closed at 118% of plan, driven by the ops-team segment; churn held under 2%." },
      { speaker: "Chair", time: "70:12", text: "Motion to approve the Series B term sheet as presented - moved, seconded, carried unanimously." },
    ],
  },
  content: {
    "meeting title": ["Northwind Labs - Q1 2026 Board of Directors Meeting"],
    "date, time and location": ["March 28, 2026, 10:00-11:30 · video conference"],
    "roll call": ["All five directors present; general counsel attending as observer; quorum confirmed"],
    "agenda adjustments": ["Added: Series B term sheet review (moved before the financial report)"],
    "report": ["Q1 revenue at 118% of plan; churn under 2%; hiring plan on track with 6 of 8 roles filled"],
    "motion, action and approval": ["Series B term sheet approved unanimously", "FY26 option pool refresh approved 4-1"],
    "adjournment": ["Meeting adjourned 11:28; next meeting June 20, 2026"],
  },
};

/* Map template names to scenarios. First keyword match wins; falls back to the team sync. */
const SCENARIO_BY_NAME: Array<{ kws: string[]; scenario: Scenario }> = [
  { kws: ["exit interview"], scenario: exitInterview },
  { kws: ["daily stand-up", "standup", "stand-up"], scenario: standup },
  { kws: ["weekly meeting"], scenario: engWeekly },
  { kws: ["sprint"], scenario: sprint },
  { kws: ["kick-off", "kickoff"], scenario: kickoff },
  { kws: ["user research"], scenario: research },
  { kws: ["1-on-1", "one-on-one", "1:1"], scenario: oneOnOne },
  { kws: ["brainstorm"], scenario: brainstorm },
  { kws: ["consulting"], scenario: consulting },
  { kws: ["gtm", "go-to-market"], scenario: gtm },
  { kws: ["soap", "medical", "referral", "patient"], scenario: medical },
  { kws: ["lecture"], scenario: lecture },
  { kws: ["panel"], scenario: panel },
  { kws: ["reader", "meet-and-greet", "interview article", "author"], scenario: writer },
  { kws: ["youtube", "video", "podcast"], scenario: media },
  { kws: ["board"], scenario: board },
  { kws: ["sales", "pitch", "champ", "anum", "spiced", "bant", "gpct", "meddic", "faint", "spin", "discovery"], scenario: sales },
  { kws: ["interview"], scenario: jobInterview },
];

function scenarioFor(template: Template): Scenario {
  const name = template.name.toLowerCase();
  for (const { kws, scenario } of SCENARIO_BY_NAME) {
    if (kws.some((k) => name.includes(k))) return scenario;
  }
  return team;
}

export interface TemplateSample {
  source: SampleSource;
  /** Resolve example content lines for a section title */
  contentFor: (sectionTitle: string) => string[];
}

export function getTemplateSample(template: Template): TemplateSample {
  const scenario = scenarioFor(template);
  return {
    source: scenario.source,
    contentFor: (sectionTitle: string) => {
      const hit = scenario.content[sectionTitle.trim().toLowerCase()];
      if (hit) return hit;
      return [
        `Key points about ${sectionTitle.toLowerCase()} extracted from the recording, written in the template's structure.`,
      ];
    },
  };
}
