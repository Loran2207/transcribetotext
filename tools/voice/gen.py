"""Voice for the prototype, generated once and committed under public/voice.

Welcome record: one MP3 per transcript line, three voices for three speakers,
word timings from the TTS, so Play on the record page is real audio with the
words lit as they are said. Guide lines: one MP3 per sentence the guide says.

Run (any machine with Python 3.11+ and internet):
  python -m venv .venv && .venv/Scripts/pip install edge-tts
  node tools/voice/lines.mjs > tools/voice/lines.json
  .venv/Scripts/python tools/voice/gen.py
"""
import asyncio, hashlib, json, os, sys
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "voice")
LINES = os.path.join(ROOT, "tools", "voice", "lines.json")
# the "Multilingual" voices are the newer, more natural generation
SPEAKERS = {"Sam Rivera": "en-US-AndrewMultilingualNeural", "Jordan Lee": "en-US-BrianMultilingualNeural", "Speaker 2": "en-US-EmmaMultilingualNeural"}
GUIDE_VOICE = "en-US-AvaMultilingualNeural"
BITRATE = 48000  # edge-tts audio-24khz-48kbitrate-mono-mp3
GAP = 0.6        # silence between lines of the dialogue, in seconds


async def say(text, voice):
    """the service drops a request now and then: three tries, a short pause between them"""
    last = None
    for attempt in range(3):
        try:
            c = edge_tts.Communicate(text, voice, boundary="WordBoundary")
            audio = bytearray(); words = []
            async for ch in c.stream():
                if ch["type"] == "audio": audio += ch["data"]
                elif ch["type"] == "WordBoundary": words.append([ch["text"], round(ch["offset"] / 1e7, 3), round(ch["duration"] / 1e7, 3)])
            if audio: return bytes(audio), words
            last = RuntimeError("empty audio")
        except Exception as e:  # noqa: BLE001
            last = e
        await asyncio.sleep(2 + attempt * 3)
    raise last


def seconds(audio): return round(len(audio) * 8 / BITRATE, 3)


async def main():
    data = json.load(open(LINES, encoding="utf-8"))
    os.makedirs(os.path.join(OUT, "welcome"), exist_ok=True); os.makedirs(os.path.join(OUT, "g"), exist_ok=True)
    t = 0.0; lines = []
    for i, seg in enumerate(data["welcome"]):
        audio, words = await say(seg["text"], SPEAKERS[seg["speaker"]])
        name = f"welcome/{i}.mp3"; open(os.path.join(OUT, name), "wb").write(audio)
        d = seconds(audio)
        lines.append({"i": i, "file": name, "start": round(t, 3), "duration": d, "words": words})
        print(f"welcome {i} {seg['speaker']} start={t:.2f} dur={d:.2f}", file=sys.stderr)
        t += d + GAP
    json.dump({"total": round(t - GAP, 3), "lines": lines}, open(os.path.join(OUT, "welcome.json"), "w", encoding="utf-8"), ensure_ascii=False)
    index = {}
    for text in data["guides"]:
        h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
        name = f"g/{h}.mp3"; path = os.path.join(OUT, name)
        if not os.path.exists(path):
            audio, _ = await say(text, GUIDE_VOICE); open(path, "wb").write(audio)
            print(f"guide {h} {text[:50]}", file=sys.stderr)
        index[text] = name
    json.dump(index, open(os.path.join(OUT, "guides.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"done: {len(lines)} welcome lines, {len(index)} guide lines", file=sys.stderr)


asyncio.run(main())
