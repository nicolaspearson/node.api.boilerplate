import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   InternalServerError:
 *     description: '500: Internal Server Error'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class InternalServerError extends HttpError {
	constructor(detail?: string) {
		const title = '500: Internal Server Error';
		super(500, title, detail);
		Object.setPrototypeOf(this, InternalServerError.prototype);
	}
}
