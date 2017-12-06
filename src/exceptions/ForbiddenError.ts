import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   Forbidden:
 *     description: '403: Forbidden'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class ForbiddenError extends HttpError {
	constructor(detail?: string) {
		const title = '403: Forbidden';
		super(403, title, detail);
		Object.setPrototypeOf(this, ForbiddenError.prototype);
	}
}
