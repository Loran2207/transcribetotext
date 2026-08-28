// App capture at any width, for dialogs and for whole screens.
//   node v2-app-any.mjs <state> <kind> <width> <cid|-> <endpoint|out.png>
// kind: dialog | full | settings
// With cid "-" the last argument is a PNG path, so the same staging can be
// reviewed before a Figma capture is spent on it.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const CAP = "https://mcp.figma.com/mcp/html-to-design/capture.js";

const [state, kind, widthArg, cid, target] = process.argv.slice(2);
const PORT = process.env.TTT_PORT || "5173";
const BASE = `http://localhost:${PORT}`;
const width = +widthArg;
/* The project draws its adaptives at real device sizes: a desktop at 1440x900,
   a tablet at 834x1112, a phone at 390x844. Anything taller is a frame showing
   space no one will ever see, which is what made the phone dialogs look small
   and adrift. */
const DEVICE_H = width >= 1024 ? 900 : width >= 700 ? 1112 : 844;
const preview = cid === "-";

const b = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  permissions: ["microphone"],
});
const p = await ctx.newPage();
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const PRESEED = {
  widget_progress: ["mixed", "expanded", ""],
  widget_failed: ["mixed", "expanded_failed", ""],
  widget_failed_many: ["failed_many", "expanded_failed", ""],
  widget_empty_failed: ["progress", "expanded_failed", ""],
  widget_confirm: ["mixed", "expanded", ""],
  widget_confirm_all: ["mixed", "expanded", ""],
  widget_collapsed_mixed: ["mixed", "", ""],
  widget_collapsed_uniform: ["uniform", "", ""],
  widget_collapsed_failed: ["failed", "", ""],
  widget_empty: ["", "", ""],
  records_ready: ["mixed", "", ""],
  toast_one: ["", "", "one"],
  toast_many: ["", "", "many"],
  toast_grouped: ["", "", "grouped"],
  toast_export: ["", "", "export"],
  toast_access_removed: ["", "", "access_removed"],
  toast_access_undo: ["", "", "access_undo"],
  toast_access_revoked: ["", "", "access_revoked"],
  toast_failed: ["", "", "failed"],
  toast_expanded: ["", "", "many"],
};
const EXPORT_FLAGS = {
  export_zip_off: ["ttt_exportsome", "1"],
  export_zip_on: ["ttt_exportsome", "1"],
  export_full: ["ttt_exportall", "1"],
  export_single: ["ttt_exportone", "1"],
  export_add: ["ttt_exportsome", "1"],
  export_files: ["ttt_exportsome", "1"],
  export_some: ["ttt_exportsome", "1"],
  export_transcript: ["ttt_exportsome", "1"],
  export_transcript_one: ["ttt_exportone", "1"],
};
if (EXPORT_FLAGS[state]) {
  const [k, v] = EXPORT_FLAGS[state];
  await p.evaluate(([kk, vv, zip]) => {
    localStorage.setItem(kk, vv);
    if (zip) localStorage.setItem("ttt_export_zip", "1");
  }, [k, v, state === "export_zip_on" ? "1" : ""]);
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}
if (state.startsWith("tpl_")) {
  await p.evaluate((v) => localStorage.setItem("ttt_plan", v), state === "tpl_pro" ? "pro" : "free");
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}
/* Sharing is about people, so the demo account carries a person's name for
   these frames. Read once when the app boots, so it goes in before the login. */
if (state.startsWith("share")) {
  await p.evaluate(() => localStorage.setItem("ttt_demo_identity", "1"));
  if (state.startsWith("sharedpage_") || state.startsWith("sharedfolder_")) {
    const sc = state.replace(/^sharedpage_/, "").replace(/^sharedfolder_/, "");
    await p.evaluate((v) => localStorage.setItem("ttt_demo_shared", v), sc);
  }
  if (state.startsWith("sharedrec_")) {
    await p.evaluate(() => localStorage.setItem("ttt_demo_shared_record", "emma"));
  }
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}
if (PRESEED[state]) {
  await p.evaluate(([a, b, c]) => {
    if (a) localStorage.setItem("ttt_demo_jobs", a);
    if (b) localStorage.setItem("ttt_demo_widget", b);
    if (c) localStorage.setItem("ttt_demo_toast", c);
  }, PRESEED[state]);
  // The provider mounts on the login page too, so the app has to boot again
  // with the flags already in storage.
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}
await p.fill('input[type="email"]', "admin@test.com");
await p.fill('input[type="password"]', "admin123");
await p.getByRole("button", { name: /sign in/i }).click();
await p.waitForURL(`${BASE}/`, { timeout: 25000 });
await p.waitForTimeout(2000);

/* The capture asks Figma for whatever family the page names, and the app names
   "Inter Variable". The design file only has "Inter", so Figma substitutes and
   every text layer lands about seven per cent narrower than the browser drew
   it - invisible on a standalone label, and a gap wherever one line is split
   into several runs, which is exactly where the spoken word is marked. The app
   already loads Google's plain "Inter", and the file has it: same typeface,
   same metrics, no substitution. */
// Tailwind inlines the theme value, so the variable is not what the page
// reads - the family has to be set on the elements themselves. Code keeps its
// monospace.
await p.addStyleTag({
  content:
    "body, body *:not(code):not(pre):not(kbd):not(code *):not(pre *):not(kbd *)" +
    "{font-family:Inter,sans-serif!important}" +
    // Figma has this family, so a real flag emoji survives into the frame.
    "[data-emoji-flag]{font-family:'Noto Color Emoji',sans-serif!important}",
});
/* The capture reports the font the browser actually used, not the one the page
   asked for, and Windows has no flag glyphs at all - so the flags came out in
   whatever fallback Chromium picked. Google serves Noto Color Emoji, Figma has
   the same family, so loading it here is what puts a real flag in the frame. */
await p.addStyleTag({
  url: "https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap",
}).catch(() => {});
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => document.fonts.load('16px "Noto Color Emoji"')).catch(() => {});
await p.waitForTimeout(900);
const set = (k, v) => p.evaluate(([kk, vv]) => localStorage.setItem(kk, vv), [k, v]);

async function openSettings(section) {
  await set("ttt_plan", "pro");
  await set("ttt_demo_settings_section", section);
  await p.locator("img[alt=Avatar]:visible").first().click();
  await p.waitForTimeout(700);
  await p.locator(".bg-popover button").first().click();
  await p.waitForTimeout(2000);
}

// planstatus_<paused|cancelled|expired>: the plan card in one of the states its
// badge already supports. Everything else on the page reads the same, which is
// what the product does.
if (state.startsWith("planstatus_")) {
  await set("ttt_demo_plan_status", state.slice(11));
  await openSettings("plan");
} else if (state.startsWith("cancel_")) {
  await set("ttt_demo_cancel", state.slice(7));
  await openSettings("plan");
} else if (state.startsWith("settings_")) {
  await openSettings(state.slice(9));
} else if (state.indexOf("pw_") === 0 || state === "del_modal") {
  await openSettings("account");
} else if (state === "freegate" || state === "freegate_done") {
  await set("ttt_demo_freegate", "1");
  await p.getByText("Instant speech", { exact: false }).filter({ visible: true }).first().click();
  await p.waitForTimeout(1000);
  await p
    .locator(String.raw`div[class*="z-[100]"]`)
    .last()
    .getByRole("button", { name: /start/i })
    .filter({ visible: true })
    .last()
    .click();
  await p.waitForTimeout(1000);
} else if (state.startsWith("widget_") || state.startsWith("toast_") || state.startsWith("export_") || state === "records_ready") {
  await p.waitForTimeout(2200);
  if (state === "records_ready") {
    // The first point of the spec is about the My Records page itself. Parked on
    // the dashboard the frame shows a slice of the same table and comes out
    // identical to the collapsed-queue frame, which reads as a duplicate.
    // Clicked here, before the resize, while the sidebar is still open.
    const link = p.getByText("My Records", { exact: true }).filter({ visible: true }).first();
    if (await link.count()) {
      await link.click({ force: true });
      await p.waitForTimeout(1800);
    }
  }
  if (state === "widget_failed_many") {
    // The Load more button is the point of this frame, and it sits below 20
    // rows inside the panel's own scroller.
    await p.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll("div"));
      for (const el of boxes) {
        const st = getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 40 && el.clientHeight < 500) {
          el.scrollTop = el.scrollHeight;
        }
      }
    });
    await p.waitForTimeout(600);
  }
  if (state === "widget_confirm") {
    await p.locator(String.raw`button[aria-label^="Delete "]`).first().click({ force: true });
    await p.waitForTimeout(900);
  }
  if (state === "widget_confirm_all") {
    await p.getByRole("button", { name: /delete all/i }).first().click({ force: true });
    await p.waitForTimeout(900);
  }
} else if (state === "entry_result_menu") {
  /* On a phone the header has no room for Share, so it sits in the actions
     sheet. The sheet only exists at the real width, so shrink first. */
  await set("ttt_plan", "pro");
  await p.evaluate(() => { history.pushState({}, "", "/transcriptions/2"); window.dispatchEvent(new PopStateEvent("popstate")); });
  await p.waitForTimeout(2600);
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: /more actions/i }).filter({ visible: true }).last().click({ force: true, timeout: 8000 });
  await p.waitForTimeout(900);
} else if (state === "entry_folder_menu") {
  /* Below lg a folder is a card with its own three dots, and a menu is a bottom
     sheet at every touch width. Same click for tablet and phone. */
  await set("ttt_plan", "pro");
  await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: /folder actions/i }).filter({ visible: true }).first().click({ force: true, timeout: 8000 });
  await p.waitForTimeout(900);
} else if (state === "records_bulk") {
  /* My Records with rows picked: the busiest mount of the shared floating bar,
     four actions at once. Kept so a change to that bar can be checked here. */
  await set("ttt_plan", "pro");
  await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll("button")).filter((b) => String(b.className).includes("size-[16px]"));
    boxes.slice(0, 3).forEach((b) => b.click());
  });
  await p.waitForTimeout(900);
} else if (state === "entry_row_menu") {
  /* The way a touch screen reaches Share on a RECORD: the card's own three
     dots. A pointer has the hover icon on the row instead, so this frame only
     exists at the touch widths. */
  await set("ttt_plan", "pro");
  await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(900);
  const recBtn = p.getByRole("button", { name: /record actions/i }).filter({ visible: true }).first();
  /* Scroll the card to the top so it is still readable above the sheet, and
     press it through the DOM: a real click at those coordinates lands on the
     floating "+" instead, which opens a different sheet entirely. */
  await recBtn.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await p.waitForTimeout(700);
  await recBtn.evaluate((el) => el.click());
  await p.waitForTimeout(900);
} else if (state.startsWith("entry_")) {
  /* Where the Share control lives, shown in the context it lives in. */
  await set("ttt_plan", "pro");
  if (state === "entry_result") {
    await p.evaluate(() => { history.pushState({}, "", "/transcriptions/2"); window.dispatchEvent(new PopStateEvent("popstate")); });
    await p.waitForTimeout(2600);
  } else {
    await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
    await p.waitForTimeout(1900);
    if (state === "entry_row") {
      const row = p.getByText("Weekly product sync - Q2 roadmap", { exact: false }).filter({ visible: true }).first();
      await row.scrollIntoViewIfNeeded();
      const box = await row.boundingBox();
      if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(700); }
    }
    if (state === "entry_folder_side") {
      const f = p.getByText("Client Calls", { exact: true }).filter({ visible: true }).first();
      const box = await f.boundingBox();
      if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(700); }
    }
    if (state === "entry_folder_card") {
      const card = p.locator('div[class*="rounded-[14px]"]').filter({ hasText: "Client Calls" }).first();
      if (await card.count()) { await card.hover().catch(() => {}); await p.waitForTimeout(600); }
    }
  }
} else if (state === "sharedpage_filter") {
  await set("ttt_plan", "pro");
  await p.getByText("Shared with me", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
  /* The column header reads OWNER on screen only because CSS shouts it - the
     DOM says "Owner", so a selector copied off the picture matches nothing.
     Below lg there is no table header at all and the same filters live in the
     Sort & filter sheet. Either way, not finding the control is a failed
     capture, not a frame to keep. */
  if (width >= 1024) {
    const owner = p.getByText(/^owner$/i).filter({ visible: true }).first();
    await owner.click({ force: true, timeout: 8000 });
  } else {
    /* Everything above ran at 1440, because that is the width at which the
       sidebar shows its items. The sheet only exists at the real width, so
       shrink first and let the layout settle. */
    await p.setViewportSize({ width, height: DEVICE_H });
    await p.waitForTimeout(900);
    await p.getByRole("button", { name: /sort & filter/i }).filter({ visible: true }).first().click({ force: true, timeout: 8000 });
  }
  await p.waitForTimeout(900);
} else if (state.startsWith("mail_")) {
  /* The four letters, each in a mail client's own chrome. */
  await p.goto(`${BASE}/email-preview?tpl=${state.slice(5)}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);
} else if (state.startsWith("link_")) {
  /* The pages a link opens, seen by somebody who is not signed in. */
  const q = state === "link_invalid" ? "?state=invalid" : state === "link_card" ? "?state=card" : state === "link_folder" ? "?kind=folder" : "";
  await p.goto(`${BASE}/share/8f3a2c41d9${q}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);
} else if (state.startsWith("recshared")) {
  /* My Records, with the marks that say which objects other people can see. */
  await set("ttt_plan", "pro");
  await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
} else if (state.startsWith("sharedrec_")) {
  /* The record page in its second state: it belongs to somebody else. */
  await set("ttt_plan", "pro");
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/2");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2600);
  if (state === "sharedrec_menu") {
    await p.getByRole("button", { name: /more actions/i }).filter({ visible: true }).last().click({ force: true });
    await p.waitForTimeout(900);
  }
} else if (state.startsWith("sharedpage_") || state.startsWith("sharedfolder_")) {
  /* The recipient's own side of the feature: the Shared with me list, and a
     folder somebody handed over. */
  await set("ttt_plan", "pro");
  await p.getByText("Shared with me", { exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(1800);
  if (state.startsWith("sharedfolder_")) {
    const card = p.locator('[data-qa-label="shared-folder-card"]').first();
    if (await card.count()) { await card.click({ force: true }); await p.waitForTimeout(1200); }
  }
  if (state === "sharedpage_bulk") {
    const boxes = p.locator('[data-slot="dialog-content"]').first();
    void boxes;
    await p.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div")).filter((d) => d.className && String(d.className).includes("h-[40px]") && String(d.className).includes("border-b"));
      rows.slice(1, 4).forEach((r) => { const b = r.querySelector("button, [role=checkbox], span"); if (b) (b).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    });
    await p.waitForTimeout(800);
  }
} else if (state.startsWith("share_") || state.startsWith("sharefolder_")) {
  /* share_<scene>       the record dialog, scene named in src/lib/share-demo.ts
     sharefolder_<scene> the same component opened from a folder
     share_free          a free account pressing Share */
  const free = state === "share_free";
  const scene = state.replace(/^sharefolder_/, "").replace(/^share_/, "");
  await set("ttt_plan", free ? "free" : "pro");
  await set("ttt_demo_share", free ? "list" : scene);

  if (state.startsWith("sharefolder_")) {
    await p.getByText("My Records", { exact: true }).filter({ visible: true }).first().click({ force: true });
    await p.waitForTimeout(1800);
    /* The folder card's own menu. The old version looked for a data attribute
       that does not exist and guarded the miss with `if (count())`, so every
       folder frame came out as the plain My Records page with no dialog on it
       at all. Not finding the control is a failed capture, not a frame to keep. */
    await p.getByRole("button", { name: /folder actions/i }).filter({ visible: true }).first().click({ force: true, timeout: 8000 });
    await p.waitForTimeout(700);
    await p.getByRole("menuitem", { name: /share folder/i }).first().click({ force: true, timeout: 8000 });
    await p.waitForTimeout(1300);
  } else {
    await p.evaluate(() => {
      history.pushState({}, "", "/transcriptions/2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await p.waitForTimeout(2400);
    const btn = p.locator('[data-qa-label="Share"]').filter({ visible: true }).first();
    await btn.click({ force: true });
    await p.waitForTimeout(1000);
  }
} else if (state.startsWith("transcript_")) {
  // There is one way to mark the spoken line now, so a state only picks which
  // replica the playhead is parked on.
  const TRANSCRIPT_FLAGS = {
    transcript_playing: "1",
    transcript_cases: "cases",
    transcript_cases_short: "cases_short",
    transcript_cases_word: "cases_word",
  };
  await set("ttt_demo_playback", TRANSCRIPT_FLAGS[state] || "1");
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2500);
} else if (state.startsWith("edit_")) {
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2500);
} else if (state === "__unused_transcript_playing") {
  // The playhead is parked a minute in, so the active line and the lines
  // already spoken are both on screen.
  await set("ttt_demo_playback", "1");
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2500);
} else if (state.startsWith("recfolder_")) {
  await p.waitForTimeout(1500);
  const link = p.getByText("My Records", { exact: true }).filter({ visible: true }).first();
  if (await link.count()) { await link.click({ force: true }); await p.waitForTimeout(1800); }
} else if (state.startsWith("copy_")) {
  // copy_menu -> the record carries a finished Russian translation, so the menu
  // has to say which language it copies. copy_plain -> no translation, so it
  // does not offer a choice that does not exist.
  if (state !== "copy_plain") await set("ttt_demo_translate", "done");
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2500);
} else if (state.startsWith("limited")) {
  await set("ttt_demo_limited", state === "limited_modal" ? "modal" : "1");
  await p.evaluate(() => {
    history.pushState({}, "", "/transcriptions/1");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(2500);
}

// The unlock card sits far down a long transcript, so on narrower frames it has to
// be scrolled into view or the capture shows only the fade.
if (width !== 1440) {
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(1200);
}

if (state === "limited") {
  // A phone screen has the player and the action bar pinned over the bottom, so the
  // frame needs room before the card can sit clear of them.
  // The phone keeps its real height; the card is scrolled to sit just above the
  // pinned player instead of the frame growing to reach it.
  // The transcript scrolls inside its own container, so scrollIntoView on the window
  // barely moves it: find the scrollable ancestor and centre the card in that.
  await p.evaluate(() => {
    const el = Array.from(document.querySelectorAll("button, a")).find((b) =>
      /unlock full access/i.test(b.textContent || "")
    );
    if (!el) return;
    const card = el.closest("div");
    let box = card ? card.parentElement : null;
    while (box && box !== document.body) {
      const st = getComputedStyle(box);
      if (/(auto|scroll)/.test(st.overflowY) && box.scrollHeight > box.clientHeight + 8) break;
      box = box.parentElement;
    }
    if (box && box !== document.body && card) {
      const cr = card.getBoundingClientRect();
      const br = box.getBoundingClientRect();
      box.scrollTop += cr.top - br.top - (br.height - cr.height) * 0.78;
    } else {
      (card || el).scrollIntoView({ block: "center" });
    }
  });
  await p.waitForTimeout(900);
}

if (state === "recfolder_filter") {
  await p.getByRole("button", { name: "Folder", exact: true }).filter({ visible: true }).first().click({ force: true });
  await p.waitForTimeout(700);
}

/* Which control opens the copy list depends on the width: a phone has it in the
   pinned action bar, everything from md up has the Copy button in the header. */
if (state.startsWith("copy_")) {
  if (width < 768) {
    await p.locator('button[aria-label="Copy"]').filter({ visible: true }).first().click({ force: true });
  } else {
    await p.getByRole("button", { name: /^Copy$/ }).filter({ visible: true }).first().click({ force: true });
  }
  await p.waitForTimeout(1000);
}

/* The edit states walk one line of the transcript through the whole flow. Each
   state stops one step further along, so the frames read as a sequence. */
if (state.startsWith("edit_")) {
  const EDITED = "Good morning everyone, this line was edited by hand before the notes went out.";
  const label = (e) => {
    const vis = Array.from(e.querySelectorAll("span")).filter((s) => s.getBoundingClientRect().width > 0);
    const t = vis.length ? vis.map((s) => s.textContent.trim()).join(" ") : (e.textContent || "").trim();
    return t || e.getAttribute("aria-label") || "";
  };
  const press = (needle) =>
    p.evaluate(([n, src]) => {
      const lab = eval("(" + src + ")");
      const el = Array.from(document.querySelectorAll("button")).find(
        (e) => e.getBoundingClientRect().width > 0 && lab(e).toLowerCase() === n.toLowerCase()
      );
      if (el) el.click();
      return !!el;
    }, [needle, label.toString()]);
  const openMore = () =>
    p.evaluate(() => {
      const el = Array.from(document.querySelectorAll("button")).find(
        (x) => (x.getAttribute("aria-label") || "") === "More" && x.getBoundingClientRect().width > 0
      );
      if (el) el.click();
      return !!el;
    });
  // On a phone the entry sits inside the actions sheet; the click still reaches it.
  const enterEdit = () =>
    p.evaluate(() => {
      const el = Array.from(document.querySelectorAll("button")).find((x) => /edit transcript/i.test(x.textContent || ""));
      if (el) el.click();
      return !!el;
    });

  const after = ["edit_saved", "edit_again", "edit_restore", "edit_restored"];
  const reentered = ["edit_again", "edit_restore", "edit_restored"];

  if (state === "edit_sheet") {
    await openMore();
    await p.waitForTimeout(900);
  } else if (state !== "edit_read") {
    await enterEdit();
    await p.waitForTimeout(900);
    if (state !== "edit_open") {
      await p.fill("textarea", EDITED);
      await p.waitForTimeout(700);
    }
    if (state === "edit_discard") { await press("Cancel"); await p.waitForTimeout(800); }
    if (after.includes(state)) { await press("Save"); await p.waitForTimeout(1200); }
    if (reentered.includes(state)) { await enterEdit(); await p.waitForTimeout(1000); }
    if (state === "edit_restore" || state === "edit_restored") {
      if (!(await press("Reset to original"))) await press("Reset");
      await p.waitForTimeout(800);
    }
    if (state === "edit_restored") { await press("Restore original"); await p.waitForTimeout(1200); }
  }
  await p.waitForTimeout(400);

  /* The converter serialises the document, and a textarea holds its text in a
     property, not in the document. Every edit field would arrive in Figma as an
     empty box, so each one is swapped for a block wearing the same styles. */
  const frozen = await p.evaluate(() => {
    let n = 0;
    for (const t of Array.from(document.querySelectorAll("textarea"))) {
      const cs = getComputedStyle(t);
      const r = t.getBoundingClientRect();
      const d = document.createElement("div");
      d.textContent = t.value;
      d.style.boxSizing = cs.boxSizing;
      d.style.width = r.width + "px";
      d.style.minHeight = r.height + "px";
      d.style.marginTop = cs.marginTop;
      d.style.padding = cs.paddingTop + " " + cs.paddingRight + " " + cs.paddingBottom + " " + cs.paddingLeft;
      d.style.borderWidth = cs.borderTopWidth;
      d.style.borderStyle = cs.borderTopStyle;
      d.style.borderColor = cs.borderTopColor;
      d.style.borderRadius = cs.borderRadius;
      d.style.backgroundColor = cs.backgroundColor;
      d.style.color = cs.color;
      d.style.fontFamily = cs.fontFamily;
      d.style.fontSize = cs.fontSize;
      d.style.fontWeight = cs.fontWeight;
      d.style.lineHeight = cs.lineHeight;
      d.style.letterSpacing = cs.letterSpacing;
      d.style.whiteSpace = "pre-wrap";
      d.style.overflowWrap = "break-word";
      t.replaceWith(d);
      n++;
    }
    return n;
  });
  console.log("froze " + frozen + " edit fields");
  await p.waitForTimeout(300);
}

// Settings now open straight onto the requested page at every width: account is
// the root and the demo flag lands on the inner page directly, so nothing has to
// be tapped first. The page scrolls inside its own container, so the window never
// grows with it: measure the container and give the frame that height, or the
// capture cuts the screen off mid-card.
if (state.startsWith("settings_") || state.startsWith("planstatus_")) {
  await p.waitForTimeout(600);
  const need = await p.evaluate(() => {
    const h1 = document.querySelector("h1");
    let el = h1 ? h1.parentElement : null;
    while (el && el !== document.body) {
      const st = getComputedStyle(el);
      if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight - 2) {
        return Math.ceil(el.getBoundingClientRect().top + el.scrollHeight + 32);
      }
      el = el.parentElement;
    }
    return 0;
  });
  if (need) {
    await p.setViewportSize({ width, height: Math.min(2600, Math.max(1000, need)) });
    await p.waitForTimeout(900);
  }
}

/* The template screen carries the phone action bar this batch is about, and the
   free plan draws it differently, so both are worth a frame. */
if (state.startsWith("tpl_")) {
  // The shell keeps the section in router state, so the phone reaches it the
  // same way the breadcrumb does rather than through a route of its own.
  await p.evaluate(() => {
    history.pushState({ usr: { page: "templates" } }, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await p.waitForTimeout(1600);
  await p.getByText("BANT", { exact: true }).filter({ visible: true }).first().click();
  await p.waitForTimeout(1800);
}

/* The four ways in from the dashboard, opened after the resize so a phone gets
   the sheet from the bottom edge and a desktop the centred card. Three of them
   keep their settings hidden until there is something to transcribe, which is
   why the link and the meeting are given a URL and the upload a file. */
if (state.startsWith("dlg_")) {
  const CARD = {
    dlg_upload: "Audio & Video Files",
    dlg_speech: "Instant speech",
    dlg_meeting: "Meeting Recorder",
    dlg_link: "Transcribe from URL",
  }[state];
  if (!CARD) {
    console.error("unknown dialog state " + state);
    process.exit(1);
  }
  /* The phone home has no create tiles, so the one door that exists at every
     width is the floating plus: a sheet below 768, a menu above it, the same
     four labels in both. */
  await p.click('[data-mobile-fab="add"]', { force: true });
  await p.waitForTimeout(1100);
  // Above 768 the plus opens a menu that animates in, so the item is found
  // before it has settled; the click is forced once it is on screen.
  await p.waitForTimeout(700);
  // From 768 up the plus opens a menu; its item has to be the click target, or
  // the press lands on the overlay above the dashboard card and only closes it.
  const item = p.locator('[role="menuitem"]').filter({ hasText: CARD });
  if (await item.count()) {
    await item.first().click();
  } else {
    await p.getByText(CARD, { exact: true }).filter({ visible: true }).first().click();
  }
  await p.waitForTimeout(1400);
  if (state === "dlg_link" || state === "dlg_meeting") {
    const url =
      state === "dlg_link"
        ? "https://youtu.be/8jPQjjsBbIc"
        : "https://meet.google.com/kqr-mzwu-xda";
    await p
      .locator('input[type="text"], input[type="url"]')
      .filter({ visible: true })
      .first()
      .fill(url);
    // Blurred, the field renders from the start and ends in an ellipsis, which
    // is what a reader of the frame needs to see.
    await p.evaluate(() => { const el = document.activeElement; if (el && el.blur) el.blur(); });
    await p.waitForTimeout(1700);
  }
  if (state === "dlg_upload") {
    await p.setInputFiles('input[type="file"]', {
      name: "Team standup.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("ID3 demo audio for the frame"),
    });
    await p.waitForTimeout(1900);
  }
}

/* The create menu is a sheet on a phone and a menu hung off the button from md
   up, so it can only be opened once the frame is at its real width. */
if (state === "create_menu") {
  await p.click('[data-mobile-fab="add"]', { force: true });
  await p.waitForTimeout(1200);
}

if (state.indexOf("pw_") === 0 || state === "del_modal") {
  const opened = await p.evaluate((which) => {
    const want = which.indexOf("pw_") === 0 ? /^(set password|change password)/i : /^delete account$/i;
    const el = Array.from(document.querySelectorAll("button")).find(
      (x) => want.test((x.textContent || "").trim()) && x.getBoundingClientRect().width > 0
    );
    if (el) el.click();
    return !!el;
  }, state);
  console.log("opened " + state + ": " + opened);
  await p.waitForTimeout(1300);
  /* The mask is what goes in, not a word to be masked later: the converter
     serialises the value, and a password input paints dots regardless. The one
     exception is the revealed state, where the characters are the point. */
  const MASK = "•".repeat(12);
  const SHORT = "•".repeat(8);
  const fields = await p.locator("input[type=password]").all();
  const fill = async (values) => {
    for (let i = 0; i < fields.length && i < values.length; i++) {
      if (values[i] === null) continue;
      await fields[i].fill(values[i]);
      await p.waitForTimeout(180);
    }
  };
  const blur = async () => {
    await p.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await p.waitForTimeout(600);
  };

  if (state === "pw_modal_filled") {
    await fill([MASK, MASK]);
    await blur();
  }

  if (state === "pw_mismatch") {
    await fill([MASK, SHORT]);
    await blur();
  }

  if (state === "pw_reveal") {
    await fill(["Newpass2026!", "Newpass2026!"]);
    await blur();
    /* Both fields are revealed on purpose. The converter writes an input's
       value, so a field left masked would still print the password in the
       frame while its icon claimed it was hidden. Revealing both keeps the
       icons, the text and the enabled Save button telling the same story. */
    const n = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[data-slot="dialog-content"] button[aria-label="Show password"]'));
      btns.forEach((b) => b.click());
      return btns.length;
    });
    console.log("reveal: clicked " + n);
    await p.waitForTimeout(800);
  }

}

/* The create dialogs are their own portal with their own scrim, so the flat
   dark field has to be painted onto that scrim: hiding the app alone leaves the
   converter a white plate that shows straight through the dimming. */
if (kind === "modal") {
  await p.evaluate(() => {
    const r = document.getElementById("root");
    if (r) r.style.visibility = "hidden";
    document.querySelectorAll("body > div").forEach((d) => {
      if (!String(d.className || "").includes("z-[100]")) return;
      const scrim = d.firstElementChild;
      if (scrim instanceof HTMLElement) {
        scrim.style.setProperty("background-color", "rgb(35, 43, 58)", "important");
        scrim.style.setProperty("backdrop-filter", "none", "important");
      }
    });
    document.documentElement.style.backgroundColor = "#232B3A";
    document.body.style.backgroundColor = "#232B3A";
    document.body.style.minHeight = "100vh";
  });
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(600);
}

if (kind === "dialog") {
  // Hide the app behind the dialog and bake the scrim, so the frame carries the
  // dialog on a flat dark field instead of a screenshot of the page.
  const h = await p.evaluate(() => {
    const d = document.querySelector('[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]');
    return d ? Math.ceil(d.getBoundingClientRect().height) : 0;
  });
  await p.evaluate(() => {
    const r = document.getElementById("root");
    if (r) r.style.visibility = "hidden";
    document.querySelectorAll("div").forEach((d) => {
      if (d.parentElement === document.body && d.className && String(d.className).includes("z-[100]")) {
        d.style.visibility = "hidden";
      }
    });
    document.documentElement.style.backgroundColor = "#232B3A";
    document.body.style.backgroundColor = "#232B3A";
    document.body.style.minHeight = "100vh";
    // The overlays are painted later, once everything that will open has opened.
  });
  // Every frame is the size of the device it stands for.
  await p.evaluate(() => {
    const nodes = document.querySelectorAll(
      String.raw`[data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]`
    );
    nodes.forEach((n) => {
      if (n instanceof HTMLElement) {
        n.style.setProperty("background-color", "rgb(255, 255, 255)", "important");
        n.style.setProperty("opacity", "1", "important");
      }
    });
  });
  void h;
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(600);
}

if (state === "export_transcript" || state === "export_transcript_one") {
  // Below lg the two panes are tabs, and the frame is meant to show the second
  // one. Above lg both panes are on screen already, so there is nothing to do.
  const tab = p.getByRole("tab", { name: /^transcript$/i });
  if (await tab.count()) {
    await tab.first().click({ force: true });
    await p.waitForTimeout(700);
  }
}

if (state === "export_add" || state === "export_files") {
  if (width < 1024) {
    // Below lg the file column is a dialog, and the picker is a second one on
    // top of it: the row opens the list, the button inside opens the search.
    const reveal = p.getByRole("button", { name: /^\s*\d+\s+files?\s*$/ }).first();
    if (await reveal.count()) {
      await reveal.click({ force: true });
      await p.waitForTimeout(800);
    }
    if (state === "export_add") {
      // The same label exists in the desktop column, which is only hidden by a
      // breakpoint - scope the click to the dialog that is actually open.
      const add = p
        .getByRole("button", { name: /add files to export/i })
        .locator("visible=true")
        .first();
      const n = await add.count();
      console.log("add button visible:", n);
      if (n) {
        await add.click({ force: true });
        await p.waitForTimeout(1000);
        console.log("dialogs after add:", await p.locator('[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]').count());
      }
    }
  } else if (state === "export_add") {
    // The picker is the point of that frame. Every resize dismisses it and the
    // dialog staging resizes once more, so this is the last thing before capture.
    await p.getByRole("button", { name: /add files to export/i }).first().click({ force: true });
    await p.waitForTimeout(900);
  }
}

await p
  .addStyleTag({
    content:
      "*{animation:none!important;transition:none!important} *:hover:not([data-sonner-toaster]):not([data-sonner-toaster] *){background-color:transparent!important}" +
      // Sonner fades a toast in and out; with animation killed the frame can
      // catch one mid-fade and the page reads straight through it.
      " li[data-sonner-toast]{opacity:1!important}",
  })
  .catch(() => {});
// A modal has to sit on a dimmed page. The real overlay fades in, and the
// capture kills animations, so the frame gets its own scrim laid over the app
// with the dialog lifted above it.
await p.evaluate(() => {
  // One dialog can open another, and the dimming between them is the point.
  // Written out in rgba because Tailwind's bg-black/50 compiles to color-mix(),
  // which the capture drops. Done here, after every click has landed.
  // Each dimming sits just under the dialog it belongs to, so a stack reads as
  // layers rather than as one flat pile.
  document.querySelectorAll('[data-slot="dialog-overlay"], [data-slot="alert-dialog-overlay"], [data-slot="sheet-overlay"], [data-slot="drawer-overlay"]').forEach((o, i) => {
    if (o instanceof HTMLElement) {
      o.style.setProperty("background-color", i === 0 ? "rgba(9, 12, 20, 0.55)" : "rgba(9, 12, 20, 0.40)", "important");
      o.style.setProperty("display", "block", "important");
      o.style.setProperty("z-index", String(189 + i * 2), "important");
    }
  });
  const all = Array.from(document.querySelectorAll(
    String.raw`[data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]`
  ));
  const dialog = all[all.length - 1];
  if (!dialog) return;
  // One dialog can open another - the file list opens the picker. Lift every one
  // of them above the scrim, in the order they were opened, or the outer dialog
  // ends up on top and the frame shows the screen you came from.
  all.forEach((d, i) => {
    if (!(d instanceof HTMLElement)) return;
    d.style.setProperty("z-index", String(190 + i * 2), "important");
    const h = d.parentElement;
    if (h instanceof HTMLElement) h.style.zIndex = String(190 + i * 2);
    d.style.setProperty("background-color", "rgb(255, 255, 255)", "important");
  });
  const scrim = document.createElement("div");
  scrim.setAttribute("data-capture-scrim", "1");
  scrim.style.position = "fixed";
  scrim.style.left = "0";
  scrim.style.top = "0";
  scrim.style.right = "0";
  scrim.style.bottom = "0";
  scrim.style.backgroundColor = "rgba(9, 12, 20, 0.45)";
  scrim.style.zIndex = "180";
  document.body.appendChild(scrim);
  // the lift above already ordered every open dialog; a second assignment here
  // used to knock the newest one back under the one it was opened from.
  // Anything the dialog itself opened has to come up with it, or the scrim
  // buries it: a picker under the dimming reads as a frame with nothing in it.
  document.querySelectorAll(String.raw`[data-slot="popover-content"], [data-radix-popper-content-wrapper]`).forEach((n) => {
    if (n instanceof HTMLElement) n.style.zIndex = "200";
  });
  // The capture drops the dialog surface on the way out, and the page behind
  // then bleeds through the whole modal. An explicit opaque fill holds it.
  dialog.style.setProperty("background-color", "rgb(255, 255, 255)", "important");
});
/* Tailwind writes bg-black/40 as color-mix(), and the converter drops it, so
   every dimming in every frame came out invisible. An explicit rgba says the
   same thing in a syntax it keeps. */
await p.evaluate(() => {
  document.querySelectorAll("div").forEach((d) => {
    if (!(d instanceof HTMLElement)) return;
    const c = String(d.className || "");
    const m = c.match(/bg-black\/(\d+)/);
    if (!m) return;
    d.style.setProperty("background-color", "rgba(9, 12, 20, " + (Number(m[1]) / 100).toFixed(2) + ")", "important");
  });
});
await p.waitForTimeout(150);

/* A dialog frame stands on a flat dark field, the way the confirmations shot
   earlier do. Hiding #root is not enough - the converter leaves a white slab
   in its place and the dimming over it reads mid grey. Painting the lowest
   dimming solid covers the slab; any dimming above it stays translucent so a
   dialog that opened another still reads as two layers. */
if (kind === "dialog") {
  await p.evaluate(() => {
    const overlays = Array.from(
      document.querySelectorAll(
        '[data-slot="dialog-overlay"], [data-slot="alert-dialog-overlay"], [data-slot="sheet-overlay"], [data-slot="drawer-overlay"]'
      )
    );
    const first = overlays[0];
    if (first instanceof HTMLElement) {
      first.style.setProperty("background-color", "rgb(35, 43, 58)", "important");
      first.style.setProperty("opacity", "1", "important");
    }
    // With nothing modal of its own to sit under, the field still has to cover
    // the slab, so one is laid in behind everything.
    if (!overlays.length) {
      const field = document.createElement("div");
      field.setAttribute("data-capture-field", "1");
      field.style.position = "fixed";
      field.style.inset = "0";
      field.style.backgroundColor = "rgb(35, 43, 58)";
      field.style.zIndex = "170";
      document.body.appendChild(field);
    }
  });
  await p.waitForTimeout(200);
}

/* On a phone the queue is a sheet, which is a modal: the frame should carry
   the dimming and the panel, not a photograph of the page underneath. Hide the
   app and paint the field - the sheet is a portal on the body, so it stays. */
const SHEET_STATES = new Set([
  "widget_progress",
  "widget_failed",
  "widget_failed_many",
  "widget_empty_failed",
  "widget_confirm",
  "widget_confirm_all",
]);
if (width < 640 && SHEET_STATES.has(state)) {
  // A phone screen is mostly the sheet plus the dimming above it, so the frame
  // is cut to that rather than left a thousand pixels tall.
  await p.setViewportSize({ width, height: DEVICE_H });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    // The sheet's own dimming is what the frame carries, and it has to hide the
    // page rather than tint it. Hiding or even removing #root is not enough -
    // the capture puts a white slab there anyway. Painting the scrim solid ends
    // the argument: whatever is behind it stops mattering.
    document.querySelectorAll("div").forEach((d) => {
      if (d instanceof HTMLElement && String(d.className || "").includes("bg-black/40")) {
        d.style.setProperty("background-color", "rgb(35, 43, 58)", "important");
      }
    });
  });
  await p.waitForTimeout(300);
}

/* The demo has no backend, so a "Failed to load templates" toast fires on every
   page load and parks itself over the header. It is an artifact of the stub, not
   a state of the product, so it does not belong in a frame. */
await p.evaluate(() => {
  document.querySelectorAll("[data-sonner-toast]").forEach((el) => {
    if (/failed to load templates/i.test(el.textContent || "")) el.remove();
  });
});

/* Sonner keeps the stack collapsed until a pointer enters it. The frame that
   documents the expanded stack hovers it; every other frame parks the pointer
   in the corner so nothing shows a hover state. */
if (state === "toast_expanded") {
  const box = await p.evaluate(() => {
    const list = document.querySelector("[data-sonner-toaster]");
    if (!list) return null;
    const r = list.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 20) };
  });
  if (box) {
    await p.mouse.move(box.x, box.y);
    await p.waitForTimeout(700);
  }
} else {
  await p.mouse.move(4, 4);
}
await p.waitForTimeout(400);

/* The converter honours the clip but not the ellipsis: a truncated name lands
   in the frame cut off mid-letter, which reads as a bug rather than as a long
   name. Bake the ellipsis into the text before the capture, measuring the real
   box so the break falls exactly where the browser puts it. */
await p.evaluate(() => {
  const CUT = "...";
  const fits = (el) => el.scrollWidth <= el.clientWidth + 1;
  // A truncating line is not always one text node: the export footer puts a
  // bold word in front of its summary. Trim the last piece of text the line
  // holds, whatever the markup around it looks like.
  const lastText = (el) => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null;
    let n = walk.nextNode();
    while (n) {
      if (n.nodeValue && n.nodeValue.trim()) last = n;
      n = walk.nextNode();
    }
    return last;
  };
  const targets = [];
  document.querySelectorAll("*").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const cs = getComputedStyle(el);
    if (cs.textOverflow !== "ellipsis") return;
    if (fits(el)) { el.style.overflow = "visible"; return; }
    targets.push(el);
  });
  for (const el of targets) {
    const node = lastText(el);
    if (!node) continue;
    const full = node.nodeValue;
    let lo = 0;
    let hi = full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      node.nodeValue = full.slice(0, mid) + CUT;
      if (fits(el)) lo = mid;
      else hi = mid - 1;
    }
    let head = full.slice(0, lo);
    while (head.length && head[head.length - 1] === " ") head = head.slice(0, -1);
    node.nodeValue = head + CUT;
  }
});
await p.waitForTimeout(200);

/* The project writes languages with a flag emoji. Windows has no colour flag
   font, so the pair of regional indicators lands in the frame as two letters. */
{
  /* The helper is not in the repository. Say so out loud rather than dying, and
     read the flags in the frame afterwards: on this machine the page already
     loads Noto Color Emoji, which is the family Figma has. */
  let flags = null;
  try { flags = readFileSync("sl-flags.js", "utf8"); } catch { console.log("flags SKIPPED - sl-flags.js is missing"); }
  if (flags) {
    const report = await p.evaluate((src) => eval(src), flags);
    console.log("flags", JSON.stringify(report));
  }
  await p.waitForTimeout(150);
}

/* The converter drops whatever space starts a text run, so the gap after the
   marked word closes up and the sentence reads "thosemockups". Hand that space
   to the mark as a right margin instead: same total width, so nothing re-wraps,
   and the run after it now starts where its first letter belongs. Capture only
   - in the app it has to stay a real space, or a line could refuse to break
   right after the spoken word and the paragraph would shift as it moves. */
const respaced = await p.evaluate(() => {
  let n = 0;
  document.querySelectorAll("mark").forEach((m) => {
    const next = m.nextSibling;
    if (!next || next.nodeType !== 3 || !next.nodeValue) return;
    if (!next.nodeValue.startsWith(" ")) return;
    const r = document.createRange();
    r.setStart(next, 0);
    r.setEnd(next, 1);
    const w = r.getBoundingClientRect().width || 4;
    next.nodeValue = next.nodeValue.slice(1);
    m.style.marginRight = w.toFixed(2) + "px";
    n += 1;
  });
  return n;
});
if (respaced) console.log("marks respaced", respaced);
await p.waitForTimeout(150);

/* html-to-design gets the line boxes wrong when wrapped text carries inline
   runs: both lines land at the same y and print on top of each other. Nothing
   shows in the browser, only in the frame. Rebuilding each visual line as its
   own block removes the ambiguity. */
if (state.startsWith("transcript_")) {
  const splitter = readFileSync("sl-linesplit.js", "utf8");
  const report = await p.evaluate(
    ([src, sel]) => {
      window.__slSplitLines = [sel];
      return eval(src);
    },
    [splitter, "p[data-transcript-line]"]
  );
  console.log("linesplit", JSON.stringify(report).slice(0, 200));
  await p.waitForTimeout(300);
}

if (process.env.TTT_DBG) {
  const info = await p.evaluate(() => Array.from(document.querySelectorAll('[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]')).map((d) => {
    const r = d.getBoundingClientRect();
    const cs = getComputedStyle(d);
    return { t: (d.textContent || "").slice(0, 22), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex, op: cs.opacity, vis: cs.visibility, disp: cs.display, pz: d.parentElement ? getComputedStyle(d.parentElement).zIndex : "-" };
  }));
  console.log("DIALOGS " + JSON.stringify(info));
}

/* Last of all: the respacing pass above rewrites text nodes, and a stationary
   cursor over shifting text fires mouseleave, which drops the row's hover. */
/* The pointer was parked in the corner before the capture, which drops any
   hover the staging set. States whose whole point is a hover put it back here,
   at the very end. */
if (state === "entry_row" || state === "entry_folder_side" || state === "entry_folder_card") {
  const label =
    state === "entry_row" ? "Weekly product sync - Q2 roadmap" : "Client Calls";
  const target = p.getByText(label, { exact: false }).filter({ visible: true }).first();
  if (await target.count()) {
    await target.scrollIntoViewIfNeeded().catch(() => {});
    const box = await target.boundingBox();
    if (box) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(800); }
  }
  /* Resting on a row long enough also raises its summary card, which lands over
     the folder strip. The frame is about where the control is, so the card goes. */
  await p.evaluate(() => {
    document.querySelectorAll("div").forEach((d) => {
      const cls = typeof d.className === "string" ? d.className : "";
      if (cls.indexOf("z-[60]") >= 0 && /SUMMARY/i.test(d.textContent || "")) d.remove();
    });
  });
  await p.waitForTimeout(150);
}

if (state === "recfolder_hover" || state === "recfolder_hover_btn") {
  // "All-hands - March highlights" is one of the records that sits in no folder,
  // so its folder cell is the empty one that offers to file it.
  // A real pointer move, because the row sets its hover state from onMouseEnter
  // and a forced hover on a matched wrapper lands on the wrong element.
  const cell = p.getByText("All-hands - March highlights", { exact: false }).filter({ visible: true }).first();
  await cell.scrollIntoViewIfNeeded();
  const box = await cell.boundingBox();
  if (box) await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(800);
  await p.evaluate((blue) => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => /add to folder/i.test(b.textContent || ""));
    if (!btn) return;
    const row = btn.closest("div[draggable]");
    if (row) row.style.background = "#f4f4f5";
    if (blue) {
      btn.style.background = "rgba(37,99,235,0.10)";
      btn.style.color = "#2563EB";
      Array.from(btn.querySelectorAll("svg")).forEach((sv) => { sv.style.color = "#2563EB"; });
    }
  }, state === "recfolder_hover_btn");
  await p.waitForTimeout(200);
}

/* Hovering the folder colour on the dashboard: the name is only in the tooltip,
   so the frame has to catch it. Radix mounts it on hover, so this is a real
   pointer move, and it happens last. */
if (state === "home_folder_hover") {
  const glyph = p.locator('div[draggable] svg[viewBox="0 0 16 16"]').first();
  const box = await p.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("div[draggable]"));
    for (const row of rows) {
      const cells = Array.from(row.children);
      const cell = cells.find((c) => c.querySelector('svg[viewBox="0 0 16 16"]') && c.getBoundingClientRect().width < 90);
      if (cell) {
        const sv = cell.querySelector("svg");
        const r = sv.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
    }
    return null;
  });
  if (box) {
    await p.mouse.move(box.x, box.y);
    await p.waitForTimeout(900);
    await p.evaluate(() => {
      Array.from(document.querySelectorAll("div")).forEach((n) => {
        const cls = typeof n.className === "string" ? n.className : "";
        if (cls.indexOf("z-[60]") >= 0 && /SUMMARY/i.test(n.textContent || "")) n.style.display = "none";
      });
    });
    await p.waitForTimeout(200);
  }
}

/* A scrolled container is drawn from its top by the capture, so the unlock card
   that the screen actually shows gets clipped. Fold the offset into a margin. */
if ((state === "limited" || state.startsWith("copy_"))) {
  await p.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll("div")).filter((el) => {
      const st = getComputedStyle(el);
      return /(auto|scroll)/.test(st.overflowY) && el.scrollTop > 0;
    });
    boxes.forEach((box) => {
      const first = box.firstElementChild;
      if (!first) return;
      const off = box.scrollTop;
      first.style.marginTop = "-" + off + "px";
      box.scrollTop = 0;
    });
  });
  await p.waitForTimeout(300);
}

/* A bottom sheet is position:fixed; the capture flattens it into flow and the
   frame grows by the sheet's height. Pin it where it visually sits. */
if (state.startsWith("copy_") && width < 768) {
  await p.evaluate(() => {
    const pin = (el, r) => {
      el.style.position = "absolute";
      el.style.top = Math.round(r.top + window.scrollY) + "px";
      el.style.left = Math.round(r.left + window.scrollX) + "px";
      el.style.width = Math.round(r.width) + "px";
      el.style.height = Math.round(r.height) + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.transform = "none";
      el.style.margin = "0";
    };
    const ov = document.querySelector('[data-slot="drawer-overlay"]');
    if (ov) pin(ov, { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight });
    const sheet = document.querySelector('[data-slot="drawer-content"]');
    if (sheet) pin(sheet, sheet.getBoundingClientRect());
    document.documentElement.style.height = window.innerHeight + "px";
    document.body.style.height = window.innerHeight + "px";
    document.body.style.overflow = "hidden";
  });
  await p.waitForTimeout(300);
}

if (preview) {
  await p.screenshot({ path: target });
  console.log("saved", target);
} else {
  /* A frame can come back with a 200 and nothing in it. The status says the
     POST was accepted, not that there was anything to send, so count the page
     first and refuse rather than file an empty frame. */
  /* The converter names the frame after the page title, so the frame arrives
     saying what it is. Without this every capture lands called
     "TranscribeToText.AI" and which frame is which has to be reconstructed
     from the order they were submitted in - which breaks the moment one of
     them fails and is re-shot later. */
  await p.evaluate((t) => { document.title = t; }, `${state} :: ${width}`);
  /* A blank capture is a served 500 or a crashed render, and it reads as a
     perfectly good frame once it is in Figma. Guard on the app actually having
     mounted, not on a node count - an empty state at 390 legitimately carries
     about a hundred nodes because the sidebar is not rendered below 1024. */
  const shell = await p.evaluate(() => {
    const root = document.getElementById("root");
    return {
      mounted: !!root && root.children.length > 0,
      nodes: document.querySelectorAll("*").length,
      text: (document.body.innerText || "").trim().length,
    };
  });
  if (!shell.mounted || shell.nodes < 15) {
    console.log("blank page:", JSON.stringify(shell), "- refusing to capture");
    await b.close();
    process.exit(1);
  }
  const src = await p.evaluate(async (u) => (await fetch(u)).text(), CAP);
  await p.evaluate(src);
  /* captureForDesign posts the frame and then never settles its promise, so
     awaiting it inside the page hangs the run for as long as the caller will
     wait - which is what made every batch look dead until something killed it.
     Fire it without awaiting and wait for the POST to come back instead. */
  const posted = p
    .waitForResponse((res) => res.url().includes("/submit") && res.request().method() === "POST", { timeout: 180000 })
    .catch(() => null);
  await p.evaluate(
    ([c, ep]) => {
      window.figma.captureForDesign({ captureId: c, endpoint: ep, selector: "body" });
    },
    [cid, target]
  );
  const res = await posted;
  console.log("submitted", res ? res.status() : "no POST seen in 180s");
}
await b.close();
process.exit(0);
