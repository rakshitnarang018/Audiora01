from flask import Flask, request, jsonify
import os
from fingerprint_to_json import generate_json_fingerprint
from match_audio import match_audio_file

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "temp")


os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/process", methods=["POST"])
def process_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    filename = "uploaded_audio_file" 
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    try:
        audio_file.save(file_path)
        
        json_file = generate_json_fingerprint(file_path)
        result = match_audio_file(json_file)

        return jsonify({"match_result": result})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
        if 'json_file' in locals() and os.path.exists(json_file):
             os.remove(json_file)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)