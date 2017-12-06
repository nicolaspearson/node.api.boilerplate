import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   NotFound:
 *     description: '404: NotFound'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class NotFoundError extends HttpError {
	constructor(detail?: string) {
		const title = '404: Not Found';
		super(404, title, detail);
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}
