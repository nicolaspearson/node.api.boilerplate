import { ValidationError } from 'class-validator';
import { HttpError } from './HttpError';

/**
 * @swagger
 * responses:
 *   BadRequest:
 *     description: '400: Bad request'
 *     schema:
 *       $ref: '#/definitions/Error'
 */
export class BadRequestError extends HttpError {
	constructor(detail?: string, validation?: ValidationError[]) {
		const title = '400: Bad Request';
		super(400, title, detail, validation);
		Object.setPrototypeOf(this, BadRequestError.prototype);
	}
}
