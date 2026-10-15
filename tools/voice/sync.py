"""After gen.py: the welcome recording's times in the app follow its audio.

Rewrites, from public/voice/welcome.json: the timestamps of every welcome
line and the end time and the length in src/lib/welcome-script.ts, the
outline times there (each section takes the time of its first line), and
the time named in the edit lesson ("At 0:48 the model wrote ...").
Run: python tools/voice/sync.py
"""
import io, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W = json.load(io.open(os.path.join(ROOT, "public", "voice", "welcome.json"), encoding="utf-8"))


def ts(s):
    s = int(round(s))
    return f"{s // 60}:{s % 60:02d}"


STARTS = [ts(l["start"]) for l in W["lines"]]
END = ts(W["total"])
LENGTH = f"{int(W['total'] // 60)} min {int(round(W['total'] % 60))}s"


def rewrite(rel, fn):
    p = os.path.join(ROOT, rel)
    s = io.open(p, encoding="utf-8").read()
    t = fn(s)
    io.open(p, "w", encoding="utf-8", newline="\n").write(t)


def script(s):
    # L(id, SPEAKER, "m:ss", ...)
    found = re.findall(r'\n  L\((\d+), [A-Z]+, "\d+:\d\d"', s)
    assert len(found) == len(STARTS), ("lines", len(found), len(STARTS))
    by_id = {}
    for i, n in enumerate(found):
        by_id[int(n)] = STARTS[i]
    s = re.sub(r'(\n  L\((\d+), [A-Z]+, )"\d+:\d\d"', lambda m: f'{m.group(1)}"{by_id[int(m.group(2))]}"', s)
    s = re.sub(r'export const WELCOME_END = "[^"]+";', f'export const WELCOME_END = "{END}";', s, count=1)
    s = re.sub(r'export const WELCOME_LENGTH = "[^"]+";', f'export const WELCOME_LENGTH = "{LENGTH}";', s, count=1)
    # outline: the time of the section's first line
    s = re.sub(r'(title: "[^"]+", timestamp: )"\d+:\d\d"(, segmentId: (\d+))', lambda m: f'{m.group(1)}"{by_id[int(m.group(3))]}"{m.group(2)}', s)
    slip = int(re.search(r"export const WELCOME_SLIP_LINE = (\d+);", s).group(1))
    return s, by_id[slip]


SLIP = {}


def script_fn(s):
    t, slip_at = script(s)
    SLIP["at"] = slip_at
    return t


rewrite("src/lib/welcome-script.ts", script_fn)
rewrite("src/app/components/onboarding/guides.ts", lambda s: re.sub(r"At \d+:\d\d the model wrote", f"At {SLIP['at']} the model wrote", s))
print("starts", STARTS, "end", END, "length", LENGTH, "slip at", SLIP["at"])
