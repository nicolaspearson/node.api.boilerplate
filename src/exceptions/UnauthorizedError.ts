import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   Unauthorized:
 *     description: '401: Authorization Required'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class UnauthorizedError extends HttpError {
	constructor(detail?: string) {
		const title = '401: Unauthorized';
		super(401, title, detail);
		Object.setPrototypeOf(this, UnauthorizedError.prototype);
	}
}
