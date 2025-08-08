/**
 * script.js
 * This file handles the client-side logic for the text-to-voice application.
 * It listens for form submissions, sends text to the serverless function,
 * and plays the returned audio.
 */

// Function to convert Base64 string to an ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Function to convert PCM data to a WAV file Blob
const pcmToWav = (pcmData, sampleRate) => {
    const dataView = new DataView(new ArrayBuffer(44 + pcmData.length * 2));
    let offset = 0;

    // WAV header
    const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
            dataView.setUint8(offset + i, str.charCodeAt(i));
        }
        offset += str.length;
    };

    const writeUint32 = (val) => {
        dataView.setUint32(offset, val, true);
        offset += 4;
    };

    const writeUint16 = (val) => {
        dataView.setUint16(offset, val, true);
        offset += 2;
    };

    writeString('RIFF'); // ChunkID
    writeUint32(36 + pcmData.length * 2); // ChunkSize
    writeString('WAVE'); // Format
    writeString('fmt '); // Subchunk1ID
    writeUint32(16); // Subchunk1Size
    writeUint16(1); // AudioFormat (1 = PCM)
    writeUint16(1); // NumChannels
    writeUint32(sampleRate); // SampleRate
    writeUint32(sampleRate * 2); // ByteRate
    writeUint16(2); // BlockAlign
    writeUint16(16); // BitsPerSample
    writeString('data'); // Subchunk2ID
    writeUint32(pcmData.length * 2); // Subchunk2Size

    // Write PCM data
    for (let i = 0; i < pcmData.length; i++) {
        dataView.setInt16(offset, pcmData[i], true);
        offset += 2;
    }

    return new Blob([dataView], { type: 'audio/wav' });
};

// Get DOM elements
const form = document.getElementById('tts-form');
const textInput = document.getElementById('text-input');
const audioPlayer = document.getElementById('audio-player');
const loadingSpinner = document.getElementById('loading-spinner');
const audioContainer = document.getElementById('audio-container');
const messageBox = document.getElementById('message-box');
const submitBtn = document.getElementById('submit-btn');

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const text = textInput.value.trim();
    if (!text) {
        showMessage("Please enter some text to convert.");
        return;
    }

    // Reset UI and show loading state
    audioContainer.classList.add('hidden');
    messageBox.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        // Call the serverless function
        const response = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Something went wrong with the API.');
        }

        const data = await response.json();
        const base64Audio = data.audioData;
        const sampleRate = data.sampleRate;

        if (!base64Audio || !sampleRate) {
            throw new Error('Invalid audio data received from the server.');
        }

        // Convert base64 audio to a playable format (WAV)
        const pcm16 = new Int16Array(base64ToArrayBuffer(base64Audio));
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);

        // Update the audio player and play the sound
        audioPlayer.src = audioUrl;
        audioContainer.classList.remove('hidden');
        audioPlayer.play();

    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message);
    } finally {
        // Hide loading state and re-enable button
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

// Function to show a message in the UI
function showMessage(message) {
    messageBox.classList.remove('hidden');
    messageBox.querySelector('p').textContent = message;
}
