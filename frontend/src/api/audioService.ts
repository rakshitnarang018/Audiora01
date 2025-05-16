
export const uploadAudio = async (audioBlob: Blob): Promise<{ song?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    // In a real app, replace with your actual API endpoint
    const response = await fetch('/upload-audio', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading audio:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred while processing your audio'
    };
  }
};

// Mock response for development (simulates backend response)
export const mockUploadAudio = async (audioBlob: Blob): Promise<{ song?: string; error?: string }> => {
  return new Promise((resolve) => {
    // Simulate network delay (1.5 to 3 seconds)
    const delay = 1500 + Math.random() * 1500;
    
    setTimeout(() => {
      // Simulate 80% success rate
      const success = Math.random() > 0.2;
      
      if (success) {
        const songs = [
          "Bohemian Rhapsody - Queen",
          "Imagine - John Lennon",
          "Hotel California - Eagles",
          "Billie Jean - Michael Jackson",
          "Shape of You - Ed Sheeran",
          "Starboy - The Weeknd",
          "Bad Guy - Billie Eilish",
          "Blinding Lights - The Weeknd",
          "Uptown Funk - Mark Ronson ft. Bruno Mars"
        ];
        
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        resolve({ song: randomSong });
      } else {
        const errors = [
          "No match found. Please try again.",
          "The recording was too short to identify.",
          "We couldn't hear enough music. Please record where the music is louder.",
          "The audio quality was too low. Please try again in a quieter environment."
        ];
        
        const randomError = errors[Math.floor(Math.random() * errors.length)];
        resolve({ error: randomError });
      }
    }, delay);
  });
};
