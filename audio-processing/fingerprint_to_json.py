import sys
import json
import time
import os
from utils import extract_spectrogram_fingerprints, get_audio_duration

def generate_json_fingerprint(audio_path, output_path="query.json"):
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"File not found: {audio_path}")

    hashes = extract_spectrogram_fingerprints(audio_path)
    just_hashes = [h[0] for h in hashes]

    fingerprint_json = {
        "fingerprints": just_hashes,
        "duration": get_audio_duration(audio_path),
        "timestamp": int(time.time())
    }

    with open(output_path, "w") as f:
        json.dump(fingerprint_json, f, indent=2)

    return output_path

def main():
    if len(sys.argv) != 2:
        print("Usage: python fingerprint_to_json.py <audio_path>")
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        generate_json_fingerprint(audio_path)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
