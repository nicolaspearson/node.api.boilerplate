import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   ServiceUnavailableError:
 *     description: '503: Service Unavailable'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class ServiceUnavailableError extends HttpError {
	constructor(detail?: string) {
		const title = '503: Service Unavailable';
		super(503, title, detail);
		Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
	}
}
