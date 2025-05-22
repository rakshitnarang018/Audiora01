import { toast } from "@/hooks/use-toast";

export const uploadAudio = async (audioBlob: Blob): Promise<{ song?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await fetch('http://localhost:8000/upload-audio', {
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
      toast({ title: "No Match Found", description: "Try uploading a clearer audio sample." });
      return { error: "No match found" };
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred while processing your audio';
    toast({ title: "Error", description: message });
    return { error: message };
  }
};
