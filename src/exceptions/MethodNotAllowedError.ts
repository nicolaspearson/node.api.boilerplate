import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   MethodNotAllowed:
 *     description: '405: Method Not Allowed'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class MethodNotAllowedError extends HttpError {
	constructor(detail?: string) {
		const title = '405: Method Not Allowed';
		super(405, title, detail);
		Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
	}
}
