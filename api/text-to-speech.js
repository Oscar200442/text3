<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TTS Player</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
    </style>
</head>
<body class="bg-gray-100">

    <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl mx-4">
        <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Text-to-Speech Player</h1>
        
        <!-- Text input area -->
        <textarea id="textInput"
            class="w-full h-32 p-4 mb-4 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Enter the text you want to convert to speech..."
        ></textarea>

        <!-- Control buttons -->
        <div class="flex justify-center items-center space-x-4 mb-4">
            <button id="generateAndPlayBtn"
                class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-105 active:scale-100"
            >
                Generate & Play
            </button>
            <button id="pauseBtn"
                class="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-transform transform hover:scale-105 active:scale-100"
                disabled
            >
                Pause
            </button>
            <button id="playBtn"
                class="px-6 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105 active:scale-100"
                disabled
            >
                Play
            </button>
        </div>

        <!-- Progress slider and time display -->
        <div class="flex items-center space-x-4 mt-4">
            <span id="currentTime" class="text-gray-600 text-sm w-12 text-right">0:00</span>
            <input type="range" id="progressSlider" value="0" min="0" max="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <span id="totalTime" class="text-gray-600 text-sm w-12">0:00</span>
        </div>

        <!-- Status/Error message box -->
        <div id="messageBox" class="mt-4 p-4 rounded-lg text-sm text-center font-medium transition-colors hidden"></div>
        
    </div>

    <script>
        // DOM elements
        const textInput = document.getElementById('textInput');
        const generateAndPlayBtn = document.getElementById('generateAndPlayBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const playBtn = document.getElementById('playBtn');
        const progressSlider = document.getElementById('progressSlider');
        const currentTimeSpan = document.getElementById('currentTime');
        const totalTimeSpan = document.getElementById('totalTime');
        const messageBox = document.getElementById('messageBox');
        let audio = new Audio();
        
        // Helper function to format time
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        // Function to display messages to the user
        function showMessage(text, isError = false) {
            messageBox.textContent = text;
            messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
            if (isError) {
                messageBox.classList.add('bg-red-100', 'text-red-800');
            } else {
                messageBox.classList.add('bg-blue-100', 'text-blue-800');
            }
        }
        
        // Function to convert a base64 string to a Uint8Array, handling URL-safe characters and padding
        function base64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        // Generate and Play button click handler
        generateAndPlayBtn.addEventListener('click', async () => {
            const text = textInput.value.trim();
            if (text === '') {
                showMessage('Please enter some text to convert to speech.', true);
                return;
            }
            
            // Show loading message and disable buttons
            showMessage('Generating speech...', false);
            generateAndPlayBtn.disabled = true;
            pauseBtn.disabled = true;
            playBtn.disabled = true;

            try {
                // We're assuming the Vercel serverless function is deployed and accessible at this path.
                const response = await fetch('/api/tts-api-server', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to generate speech.');
                }

                const result = await response.json();
                
                // Use the new, more robust function to decode the base64 audio content
                const uint8Array = base64ToUint8Array(result.audioContent);
                
                // Create a Blob and URL for the audio element
                const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Set the audio source and play
                audio.src = audioUrl;
                audio.play();

                // Clear message box and enable controls
                messageBox.classList.add('hidden');
                generateAndPlayBtn.disabled = false;
                pauseBtn.disabled = false;
                playBtn.disabled = true;

            } catch (error) {
                console.error('Error:', error);
                showMessage(`Error: ${error.message}`, true);
                generateAndPlayBtn.disabled = false;
                pauseBtn.disabled = true;
                playBtn.disabled = true;
            }
        });
        
        // Pause button click handler
        pauseBtn.addEventListener('click', () => {
            if (!audio.paused) {
                audio.pause();
                pauseBtn.disabled = true;
                playBtn.disabled = false;
            }
        });

        // Play button click handler
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                pauseBtn.disabled = false;
                playBtn.disabled = true;
            }
        });
        
        // Update the progress slider and time display as the audio plays
        audio.addEventListener('timeupdate', () => {
            const duration = audio.duration;
            const currentTime = audio.currentTime;
            
            if (!isNaN(duration)) {
                progressSlider.value = (currentTime / duration) * 100;
                currentTimeSpan.textContent = formatTime(currentTime);
                totalTimeSpan.textContent = formatTime(duration);
            }
        });
        
        // Handle seeking with the slider
        progressSlider.addEventListener('input', () => {
            const duration = audio.duration;
            if (!isNaN(duration)) {
                audio.currentTime = (progressSlider.value / 100) * duration;
            }
        });

        // Reset controls when the audio ends
        audio.addEventListener('ended', () => {
            pauseBtn.disabled = true;
            playBtn.disabled = true;
            progressSlider.value = 0;
            currentTimeSpan.textContent = "0:00";
        });
    </script>
</body>
</html>
