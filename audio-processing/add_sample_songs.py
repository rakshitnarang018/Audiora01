import os
from utils import generate_fingerprint_json
from db import add_fingerprint

def add_song_fingerprint(song_name: str, audio_path: str):
    fingerprint_data = generate_fingerprint_json(audio_path, song_name)
    add_fingerprint(song_name, fingerprint_data["fingerprints"])
    print(f"✅ Added: {song_name}")

def main():
    sample_folder = "sample_songs"
    for filename in os.listdir(sample_folder):
        if filename.lower().endswith(".wav"):
            path = os.path.join(sample_folder, filename)
            name = os.path.splitext(filename)[0]
            add_song_fingerprint(name, path)

if __name__ == "__main__":
    main()


