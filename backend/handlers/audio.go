package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Allowed audio MIME types
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

// PingHandler is a simple health check
func PingHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("pong"))
}

// UploadAudioHandler processes the audio upload
func UploadAudioHandler(w http.ResponseWriter, r *http.Request) {

	// Limit request size to 10MB
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		fmt.Println("Error parsing form data:", err)
		http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Println(">> UploadAudioHandler called")

	file, fileHeader, err := r.FormFile("audio")
	if err != nil {
		fmt.Println("Error retrieving the file:", err)
		http.Error(w, "Error retrieving the file: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	fmt.Println(">> Received audio file:", fileHeader.Filename)

	if fileHeader.Size == 0 {
		fmt.Println("Uploaded file is empty")
		http.Error(w, "Uploaded file is empty", http.StatusBadRequest)
		return
	}

	// Read first 512 bytes for content type detection
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	fmt.Println("Bytes read for detection:", n, "Error:", err)
	if err != nil {
		fmt.Println("Unable to read file for type detection:", err)
		http.Error(w, "Unable to read file for type detection", http.StatusInternalServerError)
		return
	}

	contentType := http.DetectContentType(buffer)
	fmt.Println("Detected content type:", contentType)

	// Reset file pointer to start for copying file later
	if _, err := file.Seek(0, 0); err != nil {
		fmt.Println("Failed to reset file pointer:", err)
		http.Error(w, "Failed to reset file pointer", http.StatusInternalServerError)
		return
	}

	// Check if content type is allowed
	if !allowedTypes[contentType] {
		fmt.Println("Unsupported file type detected:", contentType)
		http.Error(w, "Unsupported file type: "+contentType, http.StatusBadRequest)
		return
	}

	// Check and create temp directory if it doesn't exist
	tempDir := "./temp"
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		err = os.Mkdir(tempDir, os.ModePerm)
		if err != nil {
			fmt.Println("Failed to create temp directory:", err)
			http.Error(w, "Unable to create temp folder: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
	fmt.Println("Temp directory ready:", tempDir)

	// Create unique filename and file path
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		// Default to .webm if extension is missing
		ext = ".webm"
	}
	filename := fmt.Sprintf("audio_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(tempDir, filename)
	fmt.Println("File will be saved to:", filePath)

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		fmt.Println("Unable to create destination file:", err)
		http.Error(w, "Unable to save the file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy the uploaded file data to the destination file
	n2, err := io.Copy(dst, file)
	fmt.Println("Bytes copied to file:", n2, "Error:", err)
	if err != nil {
		fmt.Println("Error writing file:", err)
		http.Error(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("Audio file saved successfully: %s\n", filePath)

	// Send success JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "File uploaded successfully",
		"filename": filename,
	})
}
