from pymongo import MongoClient

Mongo_URL = "mongodb://mongo:27017"
client = MongoClient(Mongo_URL)
db = client.admin
collection = db.fingerprints

# Ensure indexes for fast lookup
collection.create_index("song_name", unique=True)
collection.create_index("fingerprints")

def add_fingerprint(song_name: str, fingerprints: list):
    if collection.find_one({"song_name": song_name}):
        print(f"⚠️ Song '{song_name}' already exists. Skipping.")
        return

    doc = {
        "song_name": song_name,
        "fingerprints": fingerprints
    }
    collection.insert_one(doc)
    print(f"✅ Fingerprint added for: {song_name}")

def get_all_fingerprints():
    return list(collection.find({}))

def find_best_match(query_hashes: list, threshold=0.05):
    best_match = None
    best_score = 0
    best_overlap = 0
    total_peaks = len(query_hashes)

    # Only fetch songs with at least one overlapping fingerprint
    matching_songs = collection.find({"fingerprints": {"$in": query_hashes}})

    for song in matching_songs:
        stored_hashes = set(song.get("fingerprints", []))
        overlap = len(set(query_hashes) & stored_hashes)
        score = overlap / max(total_peaks, 1)

        print(f"🔍 Checking song: {song['song_name']} | Overlap: {overlap} | Score: {score:.4f}")

        if score > best_score and score >= threshold:
            best_match = song["song_name"]
            best_score = score
            best_overlap = overlap

    similarity_percent = best_score * 100

    debug_info = {
        "matched_peaks": best_overlap,
        "total_peaks": total_peaks,
        "similarity_percent": similarity_percent,
        "threshold": threshold
    }

    return {
        "match": best_match is not None,
        "song_name": best_match,
        "score": best_score,
        "debug_info": debug_info
    }

if __name__ == "__main__":
    print("📦 Stored Songs:")
    for song in get_all_fingerprints():
        print(f"🎵 {song['song_name']}")
