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

var allowedTypes = map[string]bool{
	"audio/wav":      true,
	"audio/wave":     true,
	"audio/x-wav":    true,
	"audio/x-pn-wav": true,
	"audio/mp3":      true,
	"audio/mpeg":     true,
	"audio/webm":     true,
	"video/webm":     true,
}

type ProcessResponse struct {
	MatchResult *struct {
		SongName string `json:"song_name"`
	} `json:"match_result,omitempty"`
	Error string `json:"error,omitempty"`
}

func UploadAudioHandler(w http.ResponseWriter, r *http.Request) {
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

	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		http.Error(w, "Unable to read file for type detection", http.StatusInternalServerError)
		return
	}
	contentType := http.DetectContentType(buffer)

	if _, err := file.Seek(0, 0); err != nil {
		http.Error(w, "Failed to reset file pointer", http.StatusInternalServerError)
		return
	}

	if !allowedTypes[contentType] {
		http.Error(w, "Unsupported file type: "+contentType, http.StatusBadRequest)
		return
	}

	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = ".webm"
	}
	filename := fmt.Sprintf("audio_%d%s", time.Now().UnixNano(), ext)

	paths := []string{
		"./temp",
	}
	for _, dir := range paths {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			if err := os.MkdirAll(dir, os.ModePerm); err != nil {
				http.Error(w, "Unable to create folder: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	destPath := filepath.Join("./temp", filename)
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

	// Process audio synchronously and return response to frontend
	responseData, err := processAudioAndGetResponse(destPath)
	if err != nil {
		http.Error(w, "Processing failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseData)
}

func PingHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("pong"))
}

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

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequest("POST", "http://engine:5000/process", body)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
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
		return nil, fmt.Errorf("processing API error: %s", string(respBody))
	}

	var result ProcessResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse processing API response: %w", err)
	}

	return &result, nil
}
