import numpy as np
import librosa
import hashlib
from pydub import AudioSegment, effects
import time

def load_audio(audio_path: str, target_sr=22050):
    audio = AudioSegment.from_file(audio_path)
    normalized = effects.normalize(audio, headroom=20.0)
    samples = np.array(normalized.get_array_of_samples()).astype(np.float32)

    if normalized.channels > 1:
        samples = samples.reshape((-1, normalized.channels))
        samples = samples.mean(axis=1)

    samples /= np.iinfo(normalized.array_type).max

    if normalized.frame_rate != target_sr:
        samples = librosa.resample(samples, orig_sr=normalized.frame_rate, target_sr=target_sr)

    return samples, target_sr

def get_spectrogram_peaks(y, sr, n_fft=4096, hop_length=512, amp_min=-20, top_n_peaks=10):
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
    S_db = librosa.amplitude_to_db(S, ref=np.max)

    peaks = []
    time_bins = S_db.shape[1]
    for t in range(time_bins):
        column = S_db[:, t]
        peak_indices = np.argpartition(column, -top_n_peaks)[-top_n_peaks:]
        for f in peak_indices:
            if column[f] > amp_min:
                peaks.append((t, f))
    return peaks

def generate_hashes(peaks, fan_value=5):
    hashes = []
    for i in range(len(peaks)):
        for j in range(1, fan_value):
            if i + j < len(peaks):
                t1, f1 = peaks[i]
                t2, f2 = peaks[i + j]
                delta_t = t2 - t1
                if 0 < delta_t <= 100:
                    hash_input = f"{f1}|{f2}|{delta_t}"
                    h = hashlib.sha1(hash_input.encode('utf-8')).hexdigest()[:20]
                    hashes.append((h, t1))
    return hashes

def extract_spectrogram_fingerprints(audio_path):
    y, sr = load_audio(audio_path)
    peaks = get_spectrogram_peaks(y, sr)
    hashes = generate_hashes(peaks)
    return hashes

def get_audio_duration(audio_path: str) -> float:
    y, sr = load_audio(audio_path)
    return librosa.get_duration(y=y, sr=sr)

def generate_fingerprint_json(audio_path: str, song_name: str) -> dict:
    hashes = extract_spectrogram_fingerprints(audio_path)
    just_hashes = [h[0] for h in hashes]
    return {
        "fingerprints": just_hashes,
        "duration": get_audio_duration(audio_path),
        "song_name": song_name,
        "timestamp": int(time.time())
    }
