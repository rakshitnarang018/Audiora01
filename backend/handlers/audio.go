package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// A map of allowed audio/video MIME types for the uploaded file.
var allowedTypes = map[string]bool{
	"audio/wav":   true,
	"audio/wave":  true,
	"audio/x-wav": true,
	"audio/mp3":   true,
	"audio/mpeg":  true,
	"audio/webm":  true,
	"video/webm":  true, // Often the format from browser recording
}

// Defines the structure of the JSON response from the Python engine.
type ProcessResponse struct {
	MatchResult *struct {
		SongName string `json:"song_name"`
	} `json:"match_result,omitempty"`
	Error string `json:"error,omitempty"`
}

// Handles the multipart form audio upload from the frontend.
func UploadAudioHandler(w http.ResponseWriter, r *http.Request) {
	// Limit the request body size to 10 MB.
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, fileHeader, err := r.FormFile("audio")
	if err != nil {
		http.Error(w, "Error retrieving the file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	if fileHeader.Size == 0 {
		http.Error(w, "Uploaded file is empty", http.StatusBadRequest)
		return
	}

	// Read the first 512 bytes to detect the content type.
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		http.Error(w, "Unable to read file for type detection", http.StatusInternalServerError)
		return
	}
	contentType := http.DetectContentType(buffer)

	// Reset the file reader back to the start.
	if _, err := file.Seek(0, 0); err != nil {
		http.Error(w, "Failed to reset file pointer", http.StatusInternalServerError)
		return
	}

	if !allowedTypes[contentType] {
		http.Error(w, "Unsupported file type: "+contentType, http.StatusBadRequest)
		return
	}

	// Create a temporary directory to store the file if it doesn't exist.
	tempDir := "./temp"
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		if err := os.MkdirAll(tempDir, os.ModePerm); err != nil {
			http.Error(w, "Unable to create temp folder: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Create a unique filename and save the file to the temp directory.
	filename := fmt.Sprintf("audio_%d%s", time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
	destPath := filepath.Join(tempDir, filename)
	dst, err := os.Create(destPath)
	if err != nil {
		http.Error(w, "Unable to save the file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Call the processing function to send the file to the Python engine.
	responseData, err := processAudioAndGetResponse(destPath)
	if err != nil {
		http.Error(w, "Processing failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send the final result back to the frontend.
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseData)
}

// A simple health check handler.
func PingHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("pong"))
}

// This function forwards the saved audio file to the Python processing engine.
func processAudioAndGetResponse(filePath string) (*ProcessResponse, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("audio", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("failed to copy file into form: %w", err)
	}
	writer.Close()

	engineURL := os.Getenv("ENGINE_URL")
	if engineURL == "" {
		engineURL = "http://engine:5000"
	}

	requestURL := engineURL + "/process"

	req, err := http.NewRequest("POST", requestURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 0}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call processing API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("processing API error (%d): %s", resp.StatusCode, string(respBody))
	}

	var result ProcessResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse processing API response: %w", err)
	}

	return &result, nil
}
