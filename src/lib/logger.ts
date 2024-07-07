import { dev } from '$app/environment';
import { PUBLIC_LOG_LEVEL } from '$env/static/public';
import pino from 'pino';

const level = PUBLIC_LOG_LEVEL ?? 'error';

export const logger = dev
	? pino({
			level,
			transport: {
				target: 'pino-pretty',
				level,
				options: {
					colorize: true
				}
			}
		})
	: pino();
