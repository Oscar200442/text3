// Function to decode base64 audio and play it
async function playAudio(base64Audio) {
  // Decode the base64 string to a binary array
  const audioBlob = await fetch(`data:audio/mp3;base64,${base64Audio}`).then(res => res.blob());
  
  // Create a URL for the blob
  const audioUrl = URL.createObjectURL(audioBlob);

  // Create and play the audio element
  const audio = new Audio(audioUrl);
  audio.play();
}

// Function to handle the button click and API call
async function handleSpeak() {
  const textInput = document.getElementById('text-input').value;
  const speakButton = document.getElementById('speak-button');
  const loadingIndicator = document.getElementById('loading-indicator');
  const messageBox = document.getElementById('message-box');
  
  // Disable button and show loading indicator
  speakButton.disabled = true;
  loadingIndicator.classList.remove('hidden');
  messageBox.textContent = '';
  
  try {
    // Call the serverless function
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: textInput }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get audio from API.');
    }
    
    // Play the audio received from the server
    await playAudio(result.audioContent);
    
  } catch (error) {
    messageBox.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    // Re-enable button and hide loading indicator
    speakButton.disabled = false;
    loadingIndicator.classList.add('hidden');
  }
}

// Add event listener to the button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('speak-button').addEventListener('click', handleSpeak);
});

