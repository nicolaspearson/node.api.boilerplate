import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   NotAcceptable:
 *     description: '406: Not acceptable'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class NotAcceptableError extends HttpError {
	constructor(detail?: string) {
		const title = '406: Not Acceptable';
		super(406, title, detail);
		Object.setPrototypeOf(this, NotAcceptableError.prototype);
	}
}
