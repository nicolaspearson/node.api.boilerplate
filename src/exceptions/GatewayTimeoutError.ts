import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   GatewayTimeout:
 *     description: '504: Gateway Timeout Error'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class GatewayTimeoutError extends HttpError {
	constructor(detail?: string) {
		const title = '504: Gateway Timeout';
		super(504, title, detail);
		Object.setPrototypeOf(this, GatewayTimeoutError.prototype);
	}
}
