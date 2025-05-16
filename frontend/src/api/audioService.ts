export const uploadAudio = async (audioBlob: Blob): Promise<{ song?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    console.log('FormData:', [...formData.entries()]);

    const response = await fetch('http://localhost:8000/upload-audio', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);
    return data;

  } catch (error) {
    console.error('Error uploading audio:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred while processing your audio',
    };
  }
};
