import * as config from 'config';
import * as cors from 'kcors';
import * as Koa from 'koa';
import { UnauthorizedError } from '../exceptions';

export class Cors {
	constructor() {
		// Empty constructor
	}

	public getCorsOptions(): cors.Options {
		return {
			origin: (req: Koa.Request) => {
				const whitelist: string[] = config.get('server.api.whitelist');
				const requestOrigin = req.headers.origin;
				if (!(whitelist.indexOf(requestOrigin) > -1)) {
					throw new UnauthorizedError(
						`${requestOrigin} is not a valid origin`
					);
				}
				return requestOrigin;
			},
			allowMethods: ['GET', 'PUT', 'POST', 'DELETE'],
			exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
			allowHeaders: [
				'Content-Type',
				'Authorization',
				'Origin',
				'Accept',
				'X-Requested-With',
				'x-access-token'
			],
			maxAge: 60,
			credentials: true,
			keepHeadersOnError: true
		};
	}
}
