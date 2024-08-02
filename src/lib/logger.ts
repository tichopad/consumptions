import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import pino from 'pino';

// trace < debug < info < warn < error
const level = env.PUBLIC_LOG_LEVEL ?? 'error';
console.log('LOG LEVEL', level);

export const logger = dev
	? pino({
			level,
			serializers: {
				err: pino.stdSerializers.errWithCause
			},
			transport: {
				target: 'pino-pretty',
				level,
				options: {
					colorize: true
				}
			}
		})
	: pino({
			level,
			serializers: {
				err: pino.stdSerializers.errWithCause
			}
		});
