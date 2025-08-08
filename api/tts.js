// This file will be located at /api/tts.js in your repository

const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

// This is your handler for the Vercel serverless function
module.exports = async (req, res) => {
    // Only allow POST requests for security
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required in the request body.' });
        }

        const request = {
            input: { text: text },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'LINEAR16' },
        };

        const [response] = await client.synthesizeSpeech(request);
        const audioContent = response.audioContent.toString('base64');
        
        res.status(200).json({ audioContent });

    } catch (error) {
        console.error('Text-to-Speech API error:', error);
        res.status(500).json({ error: 'Failed to synthesize speech.' });
    }
};
