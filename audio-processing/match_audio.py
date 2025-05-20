import sys
import json
import os
from utils import extract_spectrogram_fingerprints
from db import find_best_match

def load_hashes_from_json(json_path):
    if not os.path.isfile(json_path):
        sys.exit(1)

    with open(json_path, 'r') as f:
        try:
            data = json.load(f)
            return data.get("fingerprints", [])
        except json.JSONDecodeError:
            sys.exit(1)

def match_audio_file(input_path):
    if input_path.endswith('.json'):
        query_hashes = load_hashes_from_json(input_path)
    else:
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"File not found: {input_path}")
        query_hashes = [h[0] for h in extract_spectrogram_fingerprints(input_path)]

    result = find_best_match(query_hashes, threshold=0.05)

    return {
        "song_name": result.get("song_name"),
    }

def format_match_result(result):
    if result["match"]:
        return (
            f"\n🎵 Match Found: {result['song_name']}\n"
            f"🔍 Similarity Score: {result['score'] * 100:.2f}%\n"
        )
    else:
        return "\n❌ No match found with sufficient confidence."

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python match_audio.py <audio_file_or_fingerprint_json>")
        sys.exit(1)

    input_path = sys.argv[1]

    try:
        result = match_audio_file(input_path)
        print(format_match_result(result))
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
