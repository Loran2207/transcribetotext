"""After gen.py: the welcome recording's times in the app follow its audio.

Rewrites, from public/voice/welcome.json: the eight timestamps of the welcome
transcript (src/lib/mock-transcripts.ts and the record page), its end time,
the outline times, the length in the records list, and the time named in the
edit lesson ("At 0:47 the model wrote ..."). Run: python tools/voice/sync.py
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


def times_in_block(s, key, close):
    a = s.index(key); b = s.index(close, a)
    block = s[a:b]
    found = re.findall(r'timestamp: "\d+:\d\d"', block)
    assert len(found) == len(STARTS), (key, len(found))
    it = iter(STARTS)
    block = re.sub(r'timestamp: "\d+:\d\d"', lambda m: f'timestamp: "{next(it)}"', block)
    return s[:a] + block + s[b:]


rewrite("src/lib/mock-transcripts.ts", lambda s: times_in_block(s, "welcome: [", "],"))


def page(s):
    s = times_in_block(s, "const WELCOME_SEGMENTS", "];")
    s = re.sub(r'const WELCOME_END = "[^"]+";', f'const WELCOME_END = "{END}";', s, count=1)
    s = re.sub(r'(title: "How a call becomes notes", timestamp: )"\d+:\d\d"', rf'\1"{STARTS[2]}"', s, count=1)
    s = re.sub(r'(title: "Decisions", timestamp: )"\d+:\d\d"(, segmentId: 6)', rf'\1"{STARTS[5]}"\2', s, count=1)
    return s


rewrite("src/app/components/transcription-detail-page.tsx", page)
rewrite("src/app/components/records-table.tsx", lambda s: re.sub(r'(name: "Welcome to Transcribe To Text"[^\n]*?duration: )"\d+ min \d+s"', rf'\1"{LENGTH}"', s, count=1))
rewrite("src/app/components/onboarding/guides.ts", lambda s: re.sub(r"At \d+:\d\d the model wrote", f"At {STARTS[5]} the model wrote", s))
print("starts", STARTS, "end", END, "length", LENGTH)
