import * as path from 'path';
import * as fs from 'fs';
import { AppException, ErrorCode } from '@shared/exceptions';

export async function wrapHandleMessage<T>(channel, message, func: () => Promise<T>) {
	const limit = process.env.LIMIT_REQUEUE ?? 5;
	const xDeath = message.properties.headers['x-death'];
	const death = xDeath ? xDeath[0]?.count : 0;
	try {
		const result = await func();
		channel.ack(message);
		return result;
	} catch (e) {
		console.error('Error handling message:', e);
		if (death > limit) channel.nack(message, false, false);
		else channel.nack(message, false, true);
	}
}

export function decodeBase64(encoded: string | undefined): string {
	if (!encoded) {
		throw new AppException(ErrorCode.DONT_CONVERT_BASE64);
	}
	return Buffer.from(encoded, 'base64').toString('utf-8');
}
export function getTemplateString(fileName: string, variables: Map<string, string>) {
	const filePath = path.join(
		__dirname,
		'..',
		'resource',
		'templates',
		`${fileName}.html`,
	);
	let template = fs.readFileSync(filePath, 'utf-8');
	variables.forEach((value, key) => {
		const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
		template = template.replace(regex, value);
	});
	return template;
}
