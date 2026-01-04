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
		path.join(__dirname, 'resources', 'templates', `${fileName}.html`),
		path.join(process.cwd(), 'dist', 'resources', 'templates', `${fileName}.html`),
		path.join(process.cwd(), 'src', 'resources', 'templates', `${fileName}.html`),
	];

	console.log(`[Template Search] Looking for template: ${fileName}.html`);
	console.log(`[Template Search] __dirname: ${__dirname}`);
	console.log(`[Template Search] process.cwd(): ${process.cwd()}`);

	let filePath: string | null = null;
	for (const possiblePath of possiblePaths) {
		const exists = fs.existsSync(possiblePath);
		console.log(
			`[Template Search] Checking: ${possiblePath} - ${exists ? 'FOUND' : 'NOT FOUND'}`,
		);
		if (exists) {
			filePath = possiblePath;
			break;
		}
	}

	if (!filePath) {
		console.error(`[Template Error] Template not found: ${fileName}.html`);
		console.error(`[Template Error] Checked paths:`, possiblePaths);
		console.error(
			`[Template Error] Available templates in cwd:`,
			fs.existsSync(path.join(process.cwd(), 'src', 'resources', 'templates'))
				? fs.readdirSync(path.join(process.cwd(), 'src', 'resources', 'templates'))
				: 'Directory not exists',
		);
		throw new AppException(ErrorCode.SENDMAIL_FAILED);
	}

	try {
		console.log(`[Template Success] Using template: ${filePath}`);
		let template = fs.readFileSync(filePath, 'utf-8');
		variables.forEach((value, key) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
			template = template.replace(regex, value);
		});
		return template;
	} catch (error) {
		console.error(`[Template Error] Failed to read template: ${filePath}`, error);
		throw error;
	}
}

export function getNameFile(subject: string) {
	const str: string[] = subject.split(' ');
	return str.join('-').toLocaleLowerCase();
}
