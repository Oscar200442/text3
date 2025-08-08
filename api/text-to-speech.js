import { URLSearchParams } from 'url';

// This is the Vercel serverless function
// It handles the POST request from the client and forwards it to the Google Cloud Text-to-Speech API
export default async function handler(request, response) {
  // Ensure the request method is POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the API key from environment variables. You must set this in your Vercel project settings.
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ message: 'API key not configured' });
  }

  const { text } = request.body;
  if (!text) {
    return response.status(400).json({ message: 'Text field is required' });
  }

  try {
    const apiEndpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    // Construct the request body for the Google Cloud Text-to-Speech API
    const payload = {
      input: {
        text: text
      },
      voice: {
        languageCode: 'en-US',
        // This is a high-quality Studio voice for a more natural and fluent tone.
        name: 'en-US-Studio-F',
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };
    
    // Make the fetch call to the Google Cloud Text-to-Speech API
    const apiResponse = await fetch(`${apiEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ message: `API Error: ${errorText}` });
    }
    
    const result = await apiResponse.json();
    
    // The API returns the audio data as a base64-encoded string
    // We send this string directly to the client
    response.status(200).json({ audioContent: result.audioContent });
    
  } catch (error) {
    console.error('Server error:', error);
    response.status(500).json({ message: 'An internal server error occurred.' });
  }
}
