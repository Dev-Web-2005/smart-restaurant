import * as path from 'path';
import * as fs from 'fs';
import { AppException, ErrorCode } from '@shared/exceptions';

export async function wrapHandleMessage<T>(channel, message, func: () => Promise<T>) {
	const limit = process.env.LIMIT_REQUEUE ?? 5;
	const xDeath = message.properties.headers['x-death'];
	const death = xDeath ? xDeath[0]?.count : 0;
	try {
		const result = await func();
		return result;
	} catch (e) {
		if (death > limit) {
			channel.nack(message, false, false);
		} else {
			channel.nack(message, false, true);
		}
		throw e;
	}
}

export function decodeBase64(encoded: string | undefined): string {
	if (!encoded) {
		throw new AppException(ErrorCode.DONT_CONVERT_BASE64);
	}
	return Buffer.from(encoded, 'base64').toString('utf-8');
}
export function getTemplateString(fileName: string, variables: Map<string, string>) {
	const possiblePaths = [
		path.join(__dirname, '..', 'resources', 'templates', `${fileName}.html`),
		path.join(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'..',
			'src',
			'backend',
			'notification',
			'src',
			'resources',
			'templates',
			`${fileName}.html`,
		),
		path.join(
			process.cwd(),
			'src',
			'backend',
			'notification',
			'src',
			'resources',
			'templates',
			`${fileName}.html`,
		),
		path.join(process.cwd(), 'src', 'resources', 'templates', `${fileName}.html`),
		path.resolve(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'src',
			'backend',
			'notification',
			'src',
			'resources',
			'templates',
			`${fileName}.html`,
		),
	];

	let filePath: string | null = null;
	for (const possiblePath of possiblePaths) {
		if (fs.existsSync(possiblePath)) {
			filePath = possiblePath;
			break;
		}
	}

	if (!filePath) {
		throw new AppException(ErrorCode.SENDMAIL_FAILED);
	}
	try {
		let template = fs.readFileSync(filePath, 'utf-8');
		variables.forEach((value, key) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
			template = template.replace(regex, value);
		});
		return template;
	} catch (error) {
		console.error('Error reading template file:', error);
		throw error;
	}
}

export function getNameFile(subject: string) {
	const str: string[] = subject.split(' ');
	return str.join('-').toLocaleLowerCase();
}
