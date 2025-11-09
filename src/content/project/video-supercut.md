---
title: "Video Supercut: Automatic Cuts From Speech With Whisper"
description: "A Python tool that extracts audio, detects speech, transcribes, removes repeats, and renders a concise edit"
pubDate: "Feb 20 2025"
heroImage: "../../assets/python.png"
github: "https://github.com/justinkahrs/video-supercut"
---

Cutting dead air and repeated phrases by hand is slow. This project automates the boring parts. Point it at a folder of videos, and it will:

- extract audio
- detect speech segments
- transcribe with Whisper
- remove duplicate phrases
- stitch the speaking parts together
- normalize audio and save a final edit

The result is a tighter supercut, ready for review or publication.

## Quickstart

From the README:

```bash
git clone git@github.com:justinkahrs/video-supercut.git
cd video-supercut
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
```

Add your raw videos, then run:

```bash
mkdir raw
# place .mp4 or .mkv files in ./raw
python3 main.py
```

The edited outputs will appear in `edited_videos/`.

## Configuration

You can tune behavior through environment variables and constants:

- `NOISE` controls silence threshold calibration. Accepts `low`, `medium`, or `high`.
- `MIN_SPEECH_DURATION` sets the minimum silence length for detection.
- `MARGIN_DURATION` adds padding around detected segments.
- `RAW_FOLDER` and `EDITED_FOLDER` set input and output directories.

Relevant defaults in `main.py`:

```python
NOISE_SETTING = os.environ.get("NOISE", "medium")
NOISE_OFFSET_MAP = {
    "low": 5,
    "medium": 10,
    "high": 15
}

MIN_SPEECH_DURATION = 500  # ms
MARGIN_DURATION = 200      # ms
RAW_FOLDER = "raw"
EDITED_FOLDER = "edited_videos"
```

## How it works

### 1) Extract audio with ffmpeg

Video audio is extracted to a temporary WAV file. This keeps the pipeline fast and simple.

```python
def process_video(video_file: str) -> str:
    base_name = os.path.basename(os.path.splitext(video_file)[0])
    audio_output = os.path.join(tempfile.gettempdir(), f"{base_name}_temp_audio.wav")

    (
        ffmpeg
        .input(video_file)
        .output(audio_output, format='wav', acodec='pcm_s16le', ac=1, ar='16k')
        .overwrite_output()
        .run(quiet=True)
    )

    return audio_output
```

### 2) Detect speech segments by inverting silence

Silence is detected with `pydub`. The global dBFS plus a noise offset sets the threshold. We then invert the silent ranges to get speech.

```python
def detect_speech_segments(audio_path: str):
    audio = AudioSegment.from_wav(audio_path)
    overall_dBFS = audio.dBFS
    offset = NOISE_OFFSET_MAP.get(NOISE_SETTING, 10)
    computed_threshold = overall_dBFS - offset
    silent_ranges = silence.detect_silence(
        audio,
        min_silence_len=MIN_SPEECH_DURATION,
        silence_thresh=computed_threshold
    )
    if not silent_ranges:
        return [(0, len(audio))]

    speech_segments, prev_end = [], 0
    for (sil_start, sil_end) in silent_ranges:
        if sil_start - prev_end > 0:
            speech_segments.append((prev_end, sil_start))
        prev_end = sil_end
    if prev_end < len(audio):
        speech_segments.append((prev_end, len(audio)))

    speech_segments_with_margin = []
    for (start, end) in speech_segments:
        start = max(0, start - MARGIN_DURATION)
        end = min(len(audio), end + MARGIN_DURATION)
        speech_segments_with_margin.append((start, end))
    return speech_segments_with_margin
```

### 3) Transcribe segments with Whisper

Each segment becomes a mini WAV and is passed to Whisper. This is reliable and keeps memory usage predictable.

```python
def transcribe_segments(audio_path: str, segments):
    model = whisper.load_model("base")
    audio = AudioSegment.from_wav(audio_path)

    transcriptions = []
    for (start, end) in segments:
        segment_audio = audio[start:end]
        segment_path = os.path.join(tempfile.gettempdir(), "temp_segment.wav")
        segment_audio.export(segment_path, format="wav")

        result = model.transcribe(segment_path, fp16=False)
        text = result.get("text", "").strip()
        transcriptions.append(text)

        if os.path.exists(segment_path):
            os.remove(segment_path)
    return transcriptions
```

### 4) Remove duplicate phrases

If you repeat yourself, only the last occurrence is kept. This often tightens rambly takes.

```python
def remove_duplicate_phrases(transcriptions):
    filtered, seen_phrases = [], set()
    for i in range(len(transcriptions) - 1, -1, -1):
        if transcriptions[i] not in seen_phrases:
            seen_phrases.add(transcriptions[i])
            filtered.append(transcriptions[i])
    filtered.reverse()
    return filtered
```

### 5) Build a cleaned transcript with timestamps

These records drive the video splices. They are also logged to a JSON file for inspection.

```python
def generate_cleaned_transcript(filtered_transcriptions, segments):
    cleaned = []
    for (segment, text) in zip(segments, filtered_transcriptions):
        start_ms, end_ms = segment
        cleaned.append({"start_ms": start_ms, "end_ms": end_ms, "text": text})

    transcript_path = os.path.join(tempfile.gettempdir(), "cleaned_transcript.json")
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)
    return cleaned
```

### 6) Splice video to only the speaking parts

`moviepy` subclips each speech region, then concatenates them.

```python
def compile_final_video(video_file: str, cleaned_transcript):
    clip = mp.VideoFileClip(video_file)
    subclips = []
    for entry in cleaned_transcript:
        start_s = entry["start_ms"] / 1000.0
        end_s = entry["end_ms"] / 1000.0
        subclip = clip.subclip(start_s, end_s)
        subclips.append(subclip)
    if not subclips:
        return None
    final_clip = mp.concatenate_videoclips(subclips, method="compose")
    return final_clip
```

### 7) Normalize and save

An intermediate file is rendered, then `ffmpeg` loudness normalization produces the final output.

```python
def save_output(final_clip, output_folder: str, original_video: str):
    if not final_clip:
        print(f"No segments found to compile for {original_video}. Skipping save.")
        return

    Path(output_folder).mkdir(parents=True, exist_ok=True)
    base_name = os.path.basename(original_video)
    edited_output_path = os.path.join(output_folder, f"edited_{base_name}")

    if os.path.exists(edited_output_path):
        os.remove(edited_output_path)

    final_clip.write_videofile(edited_output_path, codec="libx264", audio_codec="aac")
    final_output_path = os.path.join(output_folder, f"final_{base_name}")

    if os.path.exists(final_output_path):
        os.remove(final_output_path)

    normalize_cmd = f"ffmpeg -y -i \"{edited_output_path}\" -af loudnorm \"{final_output_path}\""
    print(f"Normalizing audio: {normalize_cmd}")
    subprocess.run(normalize_cmd, shell=True, check=True)
    print(f"Saved normalized video to: {final_output_path}")

    if os.path.exists(edited_output_path):
        os.remove(edited_output_path)
        print(f"Removed intermediate file: {edited_output_path}")
```

## Parallel processing and prerequisites

The script will try to locate `ffmpeg`. If it is missing, it falls back to `imageio-ffmpeg` when available. Files are processed in parallel with a `ProcessPoolExecutor`.

```python
def main():
    import shutil
    from concurrent.futures import ProcessPoolExecutor

    if not shutil.which("ffmpeg"):
        try:
            import imageio_ffmpeg
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
            os.environ["FFMPEG_BINARY"] = ffmpeg_path
            print("ffmpeg not found in PATH, using imageio-ffmpeg at", ffmpeg_path)
        except ImportError:
            print("ffmpeg not found and imageio-ffmpeg not installed. Please install ffmpeg.")
            return

    Path(EDITED_FOLDER).mkdir(parents=True, exist_ok=True)

    video_files = glob.glob(os.path.join(RAW_FOLDER, "*.mp4")) + glob.glob(os.path.join(RAW_FOLDER, "*.mkv"))
    if not video_files:
        print(f"No .mp4 or .mkv files found in '{RAW_FOLDER}' folder.")
        return

    with ProcessPoolExecutor() as executor:
        executor.map(process_single_video, video_files)
```

## Tips

- Start with `NOISE=medium`. If you see chatter cutting off, try `low`. If silence detection misses pauses, try `high`.
- Tweak `MARGIN_DURATION` to avoid clipping the first or last syllable of a sentence.
- Whisper models vary in accuracy and speed. You can swap `base` for `small` or `medium` in `whisper.load_model`.
- The JSON transcript in your temp directory is handy for debugging cuts.

## Closing

Video Supercut aims to make editing feel lighter. It does not invent content. It just helps you keep the parts that matter. Point it at a folder, grab a coffee, and you will come back to tighter takes that respect your voice.
