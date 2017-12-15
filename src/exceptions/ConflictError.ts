import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   Conflict:
 *     description: '409: Conflict'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class ConflictError extends HttpError {
	constructor(detail?: string) {
		const title = '409: Conflict';
		super(409, title, detail);
		Object.setPrototypeOf(this, ConflictError.prototype);
	}
}
