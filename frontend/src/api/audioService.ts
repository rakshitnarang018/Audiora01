import { toast } from "@/hooks/use-toast";

// This line reads the VITE_API_URL you set in Vercel's project settings.
// It ensures the app calls the deployed Render backend, not localhost.
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const uploadAudio = async (audioBlob: Blob): Promise<{ song?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    // Use the environment variable to construct the full API endpoint URL
    const response = await fetch(`${API_BASE_URL}/upload-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    const songName = data?.match_result?.song_name;

    if (songName) {
      toast({ title: "Match Found!", description: `Song: ${songName}` });
      return { song: songName };
    } else {
      toast({ title: "No Match Found", description: "Could not identify the song. Please try again." });
      return { error: "No match found" };
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred while processing your audio.';
    console.error("Upload error:", error); // Log the full error to the console for debugging
    toast({ variant: "destructive", title: "Error", description: message });
    return { error: message };
  }
};