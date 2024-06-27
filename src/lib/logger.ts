import { dev } from '$app/environment';
import pino from 'pino';

const level = 'debug';

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
