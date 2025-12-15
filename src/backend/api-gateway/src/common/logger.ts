import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const winstonConfig = {
	transports: [
		new winston.transports.Console({
			level: 'info',
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.timestamp(),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				winston.format.printf(({ level, message, timestamp }) => {
					return `${timestamp} [${level}]: ${message}`;
				}),
			),
		}),

		new winston.transports.DailyRotateFile({
			dirname: 'logs',
			filename: 'app-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			maxSize: '10m',
			maxFiles: '7d',
			level: 'info',
			zippedArchive: true,
			format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
		}),

		new winston.transports.DailyRotateFile({
			dirname: 'logs',
			filename: 'error-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			level: 'error',
			maxSize: '5m',
			maxFiles: '30d',
			zippedArchive: true,
			format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
		}),
	],
};

export const logger = winston.createLogger(winstonConfig);
