"""Echo's lines with Chatterbox (Resemble AI, MIT), checked by ear by Whisper.

Each guide line is generated on the GPU, transcribed back with Whisper and
compared word by word with the text; a take that drops, adds or garbles more
than a few words is made again (up to four takes, the best one kept). The MP3s
replace public/voice/g/<hash>.mp3 under the same names, so the app does not
change. The welcome dialogue stays with tools/voice/gen.py (three voices).

Needs a CUDA PyTorch (an RTX 50xx wants torch 2.7+ with cu128), chatterbox-tts,
openai-whisper and lameenc. Run: python tools/voice/gen_chatterbox.py [--only N]
"""
import hashlib, io, json, os, re, sys, time
import numpy as np
import torch
import lameenc
import whisper
from chatterbox.tts import ChatterboxTTS

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "voice")
LINES = os.path.join(ROOT, "tools", "voice", "lines.json")
REPORT = os.path.join(ROOT, "tools", "voice", "chatterbox-report.json")
MAX_TAKES = 4
OK_WER = 0.12


def words(t):
    t = t.lower().replace("ctrl k", "control k").replace("&", " and ")
    return re.findall(r"[a-z0-9']+", t)


def wer(ref, hyp):
    r, h = words(ref), words(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def mp3(wav, sr):
    pcm = (np.clip(wav, -1, 1) * 32767).astype(np.int16).tobytes()
    enc = lameenc.Encoder(); enc.set_bit_rate(64); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main():
    only = int(sys.argv[sys.argv.index("--only") + 1]) if "--only" in sys.argv else None
    data = json.load(io.open(LINES, encoding="utf-8"))
    guides = data["guides"][:only] if only else data["guides"]
    t0 = time.time()
    tts = ChatterboxTTS.from_pretrained(device="cuda")
    ear = whisper.load_model("small.en", device="cuda")
    print(f"models in {time.time() - t0:.0f}s", flush=True)
    os.makedirs(os.path.join(OUT, "g"), exist_ok=True)
    index, report = {}, []
    for n, text in enumerate(guides):
        h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
        best = None
        for take in range(MAX_TAKES):
            torch.manual_seed(1000 + take)
            wav = tts.generate(text, exaggeration=0.45, cfg_weight=0.5).squeeze(0).cpu().numpy()
            heard = ear.transcribe(_resample(wav, tts.sr), language="en", fp16=True)["text"]
            score = wer(text, heard)
            if best is None or score < best[0]: best = (score, wav, heard, take)
            if score <= OK_WER: break
        score, wav, heard, take = best
        open(os.path.join(OUT, "g", f"{h}.mp3"), "wb").write(mp3(wav, tts.sr))
        index[text] = f"g/{h}.mp3"
        report.append({"n": n, "hash": h, "wer": round(score, 3), "takes": take + 1, "text": text, "heard": heard.strip()})
        print(f"{n + 1}/{len(guides)} wer={score:.2f} takes={take + 1} {text[:60]}", flush=True)
    if not only:
        json.dump(index, io.open(os.path.join(OUT, "guides.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump(report, io.open(REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    bad = [r for r in report if r["wer"] > OK_WER]
    print(f"done in {time.time() - t0:.0f}s: {len(report)} lines, {len(bad)} above {OK_WER}", flush=True)


def _resample(wav, sr):
    """Whisper hears 16 kHz"""
    import torchaudio.functional as F
    return F.resample(torch.from_numpy(wav).float(), sr, 16000).numpy()


main()
