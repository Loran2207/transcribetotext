import type { ExportSegment } from "@/lib/export-formats";

/* Mock transcript segments for the demo records (keyed by record id).
   Used by the export dialog live preview and exported files. */
export const MOCK_TRANSCRIPTS: Record<string, ExportSegment[]> = {
  "2": [
    { speaker: "Maria Garcia", timestamp: "0:02", text: "Alright, everyone's here — let's get started. Today I want to lock the Q2 roadmap: the new export flow, transcription accuracy for noisy audio, and folder sharing." },
    { speaker: "Alex Johnson", timestamp: "0:41", text: "Export flow first. The unified dialog is in staging and QA looks good. If design signs off this week, we can ship it behind a flag by Friday." },
    { speaker: "Maria Garcia", timestamp: "2:15", text: "Great. On accuracy — support keeps flagging call-center recordings with background chatter. What's realistic for this quarter?" },
    { speaker: "James Chen", timestamp: "3:08", text: "We benchmarked the new noise-robust model last week. Word error rate drops from 11% to 7% on the noisy set. I'd say a beta by April 18 is doable." },
    { speaker: "Alex Johnson", timestamp: "12:34", text: "Folder sharing is the riskiest one. Permissions touch every list view. I'd rather split it: read-only links in Q2, full collaboration in Q3." },
    { speaker: "Maria Garcia", timestamp: "32:10", text: "Agreed. So: export flow this sprint, accuracy beta April 18, sharing split into two phases. I'll send the summary and owners after the call." },
  ],
  "1": [
    { speaker: "Kirill Kuts", timestamp: "0:05", text: "Thanks for joining, Dana. The goal today is to get your workspace set up and your first dispatch calls transcribed end to end." },
    { speaker: "Dana Whitfield", timestamp: "1:12", text: "Perfect. Our dispatchers handle around forty calls a day, and right now nobody has time to write summaries. That's the main pain." },
    { speaker: "Kirill Kuts", timestamp: "4:30", text: "Then let's start with the upload flow. You can drag a batch of recordings here — each one gets a transcript, an AI summary and action items automatically." },
    { speaker: "Dana Whitfield", timestamp: "18:47", text: "That summary view is exactly what operations asked for. Can we export these as Word documents for the weekly report?" },
    { speaker: "Kirill Kuts", timestamp: "19:20", text: "Yes — single files or a whole batch as a zip archive. I'll show the export dialog in a second. Let's also invite your two team leads now." },
    { speaker: "Dana Whitfield", timestamp: "41:55", text: "Sounds good. Let's run the two-week pilot with the dispatch team and check in every Friday." },
  ],
  "3": [
    { speaker: "You", timestamp: "0:01", text: "Note to self about the onboarding flow — the second confirmation step feels redundant, almost everyone just clicks through it." },
    { speaker: "You", timestamp: "0:38", text: "Idea: drop that step, add a small progress indicator at the top, and prefill the workspace name from the company domain." },
    { speaker: "You", timestamp: "1:21", text: "Also check with Maria whether the invite-teammates screen can move to the end. Draft this as a proposal before Thursday's design review." },
  ],
  "4": [
    { speaker: "Sarah Kim", timestamp: "0:03", text: "Thanks for making time today. Could you start with the part of your frontend work you're most proud of?" },
    { speaker: "Daniel Reyes", timestamp: "0:19", text: "Sure. At my current company I led the migration to a shared design system — about ninety components, fully typed, with visual regression tests on every PR." },
    { speaker: "Sarah Kim", timestamp: "1:24", text: "Nice. How do you usually approach state management in a large React app?" },
    { speaker: "Daniel Reyes", timestamp: "1:42", text: "Keep server state in a query cache, keep UI state local, and resist global stores until there's a real need. Most complexity I've seen came from putting everything in one store too early." },
    { speaker: "Sarah Kim", timestamp: "3:10", text: "Great answer. I'll recommend you for the technical round — expect an invite with a small take-home this week." },
  ],
  "5": [
    { speaker: "James Chen", timestamp: "0:04", text: "Quick round, sprint 14. Export dialog QA is done — all twelve scenarios pass. I'm picking up the pagination polish next." },
    { speaker: "Alex Johnson", timestamp: "1:32", text: "Two visual bugs left in the records table: the hover state on starred rows and a misaligned folder icon. Both should land today." },
    { speaker: "Priya Nair", timestamp: "3:05", text: "Translation service contract is still blocked on legal review. I pinged them yesterday — they promised an answer by Wednesday." },
    { speaker: "James Chen", timestamp: "5:48", text: "Okay. If legal slips again, we ship the language picker with the mock provider and swap the backend later. Anything else? Good — see everyone tomorrow." },
  ],
  "6": [
    { speaker: "Narrator", timestamp: "0:02", text: "In this short demo you'll see how to turn any recording into a transcript and an AI summary in under a minute." },
    { speaker: "Narrator", timestamp: "0:18", text: "Upload a file or paste a meeting link. The transcript appears with speaker labels and timestamps you can click to jump through the audio." },
    { speaker: "Narrator", timestamp: "0:52", text: "Switch to the Summary tab for key points and action items, then use Export to download everything as text, Word or PDF." },
  ],
};