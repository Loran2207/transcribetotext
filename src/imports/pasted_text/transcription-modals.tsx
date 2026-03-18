Build 4 transcription modal dialogs and a floating upload progress widget 
for a transcription SaaS platform. The app already has the main UI with 
buttons that trigger these modals. Implement only the functionality described 
below — do not make assumptions about visual design beyond what is specified.

═══════════════════════════════════════════════════════
MODAL 1: UPLOAD FILE
═══════════════════════════════════════════════════════

Trigger: "Upload file" button click.

File Input:
- Drag & drop zone. On drag-over, the zone changes to an active/highlighted state.
- "Browse file" button opens the native OS file picker.
- Accepted formats: .mp3, .mp4, .m4a, .mov, .aac, .wav, .oog, .opus, .mpeg, .wma, .wmv
- Max size: 1GB (audio) / 10GB (video). Max duration: 5 hours.
- After file selection: show filename + size inside the drop zone, 
  with a remove/clear button.
- Multiple file selection is NOT supported — single file only.

Transcription Mode (tab toggle, 2 options):
- "Monolingual transcription" — default, always available.
- "Bilingual transcription" — premium feature, show a visual badge 
  (e.g. lightning bolt icon). If the user does not have access, 
  clicking this tab opens an upgrade prompt instead of activating the mode.
  In bilingual mode: show two language selectors (primary + secondary language).

Transcription Language:
- Dropdown selector. Default: English.
- Includes "Detect automatically" as an option.
- In monolingual mode: one selector. In bilingual mode: two selectors.

Speaker Identification:
- Toggle switch, off by default.
- When enabled: show a number selector for speaker count 
  (default 2, range 1–10, plus "Auto-detect" option).

Start Transcribe button:
- Disabled until a valid file is selected and loaded into the drop zone.
- Becomes active once file is ready.

Close (X button):
- Closes the modal immediately with no confirmation.
- Form state resets on close.

═══════════════════════════════════════════════════════
MODAL 2: RECORD AUDIO
═══════════════════════════════════════════════════════

Trigger: "Record" button click. 
On open, browser requests microphone permission if not already granted. 
If permission is denied, show an error state inside the modal 
(do not proceed to recording state).

Recording State:
- Waveform/audio visualization area, animates while recording is active.
- Live timer, counts up from 00:00 (format MM:SS).
- Recording indicator: animated red dot + "Recording" label.

Pause / Resume:
- "Pause Recording" button pauses the timer and waveform animation.
- While paused: button label changes to "Resume Recording".
- Timer and waveform resume on click.

Transcription Mode toggle: same as Modal 1 (Monolingual / Bilingual).

Transcription Language selector: same as Modal 1.

Speaker Identification toggle: same as Modal 1.

Start Transcribe button:
- Available as soon as recording begins (not disabled).
- Clicking it stops the recording and submits audio for transcription.
- If recording is paused and user clicks Start Transcribe, 
  treat paused audio as final — submit what was recorded.

Close (X button) — SAFE CLOSE RULE:
- If recording is NOT active (not started, or already submitted): 
  close immediately.
- If recording IS active (including paused state): 
  do NOT close immediately. Trigger the Stop Recording 
  Confirmation Dialog (see below).

═══════════════════════════════════════════════════════
MODAL 3: TRANSCRIBE VIA LINK
═══════════════════════════════════════════════════════

Trigger: "Link" / "Import URL" button click.

Link Input:
- Single text input, placeholder: "Paste the link here".
- Supported sources indicated via logos near the input: 
  YouTube, Dropbox, Google Drive.
- Client-side URL validation on blur and on submit attempt. 
  If not a valid URL format, show an inline error message below the field.
- On valid URL paste/input: clear any error state.

Transcription Mode toggle: same as Modal 1 (Monolingual / Bilingual).

Transcription Language selector: same as Modal 1.

Speaker Identification toggle: same as Modal 1.

Start Transcribe button:
- Disabled until the input contains a valid URL.
- Becomes active on valid input.

Close (X button):
- Closes immediately, no confirmation. Form state resets.

═══════════════════════════════════════════════════════
MODAL 4: MEETING VIA LINK (BOT JOIN)
═══════════════════════════════════════════════════════

Trigger: "Meeting" / "Record meeting" button click.

Intro text:
- Explain that a bot will join the meeting and wait up to 5 minutes for host 
  approval. If not admitted within that time, recording will not start.
- "Click here for tutorial" link — opens in new tab.
- "Connect Google Calendar" link — opens in new tab.

Supported platforms: show logos for Zoom, Google Meet, Microsoft Teams, Webex.

Meeting invite link input:
- Text field, placeholder: "Paste the meeting invite link here".
- Platform logos shown inside or adjacent to the field.
- Client-side validation: must be a valid URL. Show inline error if not.

Meeting name input (optional):
- Text field, pre-populated with "Meeting 1".
- Auto-increments for subsequent sessions opened in the same browser session: 
  Meeting 2, Meeting 3, etc.

Transcription Mode toggle: same as Modal 1 (Monolingual / Bilingual).

Transcription Language:
- Labeled dropdown, default "English". Same shared language list as other modals.

Advanced Options (collapsible section, collapsed by default):
  
  Bot display name:
  - Editable text field. Default value: "[AppName] Bot".
  - User can rename it freely. This is the name meeting participants will see.
  
  Show recording notification poster:
  - Toggle switch, ON by default.
  - "Preview" link next to the label — opens a small preview 
    (lightbox or tooltip) of what participants will see.
  
  Real-time translation:
  - Dropdown selector. Default: "Translation: Off".
  - Premium feature — show upgrade badge on the label.
  - If user does not have access, selecting a language opens upgrade prompt.
  
  Notify participants:
  - Toggle switch, ON by default.
  - When enabled: show an editable textarea with a default message:
    "I'm recording this meeting with [AppName] for note-taking purposes."
  - User can freely edit this message.

Start Transcribe / "Transcribe now" button:
- Disabled until a valid meeting link is entered.
- Becomes active on valid input.

Close (X button):
- Closes immediately, no confirmation.

═══════════════════════════════════════════════════════
CONFIRMATION DIALOG: STOP RECORDING
═══════════════════════════════════════════════════════

Trigger: X button click (or backdrop click) on Modal 2 
while recording is active or paused.

Behavior:
- Renders as a small dialog on top of the Record modal 
  (Modal 2 remains visible behind it).
- Title: "Recording in progress"
- Body: "Recording is still in progress. 
  Are you sure you want to close this window?"
- Two buttons:
    "Cancel" — dismisses this dialog, returns user to active recording state. 
               Recording continues uninterrupted.
    "Stop & Close" — stops and discards the recording entirely, 
                     closes Modal 2. 
                     This button uses a destructive visual style.

═══════════════════════════════════════════════════════
FLOATING UPLOAD PROGRESS WIDGET
═══════════════════════════════════════════════════════

Trigger: Appears in the bottom-right corner of the screen immediately 
after the user confirms "Start Transcribe" in any modal.

Position & Layout:
- Fixed position, bottom-right corner of the viewport.
- Does not block main content interaction.
- Global/layout-level component — persists across page navigation.

Header:
- Title: "Uploaded records"
- Minimize button (— icon): collapses the panel to show only the header row.
- Clicking the header again (or an expand button) restores full view.

Job List (table/list layout):
Each row represents one transcription job and contains:
  - File type icon (differentiate audio vs video)
  - File name (truncated if too long, full name on hover tooltip)
  - Duration (shown once known: e.g. "7s", "2m 14s", "1h 03m")
  - Progress bar (animated fill while processing; fully filled on completion)
  - Status indicator:
      - Spinner/loading icon — while uploading or processing
      - Green checkmark — on successful completion
      - Red X / error icon — on failure
  - Action link:
      - While processing: no link or a "Cancel" option
      - On success: "Record detail" — navigates to the transcription result page
      - On error: "Retry" option

Multiple simultaneous jobs:
- All active and recently completed jobs are shown in the same widget.
- New jobs are added to the top of the list.

Error state:
- Failed row is visually distinguished (e.g. muted/red tint).
- Shows error icon + "Retry" action.

Dismissal:
- Widget can be minimized but not permanently closed while jobs are active.
- Once all jobs are complete, a close/dismiss button (X) appears 
  on the widget to allow full removal.

═══════════════════════════════════════════════════════
SHARED BEHAVIOR ACROSS ALL MODALS
═══════════════════════════════════════════════════════

Backdrop click:
- Modals 1, 3, 4: clicking the backdrop closes the modal immediately.
- Modal 2 while recording active: backdrop click triggers 
  the Stop Recording Confirmation Dialog, same as X button.

ESC key:
- Same safe-close rules as X button for each modal.

Single modal at a time:
- Only one modal can be open at a time. 
  Opening a new modal closes the current one 
  (if safe to do so — apply Stop Recording dialog if needed).

Form state:
- All modal form state resets on close. 
  No state is persisted between opens, except:
  - Meeting name auto-increment counter persists within the browser session.

Language list:
- All language dropdowns across all modals share the same language list 
  component. The list supports search/filter by typing.

Premium feature gating:
- Features marked as premium (bilingual transcription, real-time translation, 
  bot video recording if added later) must be clearly marked with a visual badge.
- Users without access see a non-destructive upgrade prompt on interaction — 
  they are never silently blocked or shown an error.
- Premium state is determined by a prop/context value passed into the modals 
  (e.g. `userPlan: 'free' | 'pro'`). Do not hardcode plan logic inside 
  individual components.

Accessibility:
- All modals must be keyboard navigable (Tab order, Enter to confirm, 
  ESC to close).
- Modals trap focus while open.
- Interactive elements have appropriate ARIA labels.