/**
 * api/text-to-speech.js
 * This is a Vercel serverless function (Node.js) that handles API requests.
 * It uses the Gemini API to convert text to speech and returns the audio data.
 */

// This is the Vercel serverless function entry point
export default async function handler(request, response) {
    // Check if the request method is POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text } = request.body;

        if (!text || text.length === 0) {
            return response.status(400).json({ error: 'Text input is required.' });
        }

        // API payload for the Gemini TTS model
        const payload = {
            contents: [{
                parts: [{ text: text }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                // Choose a voice from the available options. "Kore" is used here.
                // Other options include "Puck", "Charon", "Zephyr", etc.
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" }
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        
        // Vercel handles the API key injection for the Gemini API
        const apiKey = ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
        
        // Exponential backoff for API calls to handle rate limits
        const makeApiCall = async (retries = 5, delay = 1000) => {
            try {
                const apiResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!apiResponse.ok) {
                    if (apiResponse.status === 429 && retries > 0) { // Too many requests
                        await new Promise(res => setTimeout(res, delay));
                        return makeApiCall(retries - 1, delay * 2);
                    }
                    throw new Error(`API returned status ${apiResponse.status}: ${apiResponse.statusText}`);
                }
                return apiResponse.json();
            } catch (error) {
                if (retries > 0) {
                    await new Promise(res => setTimeout(res, delay));
                    return makeApiCall(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const apiResult = await makeApiCall();
        const part = apiResult?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (!audioData || !mimeType) {
            return response.status(500).json({ error: 'Failed to retrieve audio data from API.' });
        }
        
        // Extract the sample rate from the mimeType string (e.g., "audio/L16;rate=24000")
        const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
        
        // Send the base64 audio data and sample rate back to the client
        return response.status(200).json({
            audioData,
            sampleRate
        });

    } catch (error) {
        console.error('Error in API route:', error);
        return response.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
