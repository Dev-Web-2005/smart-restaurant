import axios from 'axios';

const TEXT_TO_SPEECH_API_URL =
	'https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17';

const ttsClient = axios.create({
	baseURL: TEXT_TO_SPEECH_API_URL,
	headers: {
		'xi-api-key': process.env.TTS_API_KEY || '',
	},
});

export function synthesizeSpeech(text: string): Promise<Buffer> {
	return ttsClient
		.post('/', { text }, { responseType: 'arraybuffer' })
		.then((response) => Buffer.from(response.data));
}
