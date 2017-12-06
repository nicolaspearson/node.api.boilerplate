import { ValidationError } from 'class-validator';
import HttpValidationError from './HttpValidationError';

/**
 * @swagger
 * responses:
 *   DefaultError:
 *     description: 'An error has occurred'
 *     schema:
 *       $ref: '#/definitions/Error'
 *
 * definitions:
 *   Error:
 *     type: object
 *     properties:
 *       errors:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             status:
 *               type: integer
 *               description: The HTTP Status Code
 *             title:
 *               type: string
 *               description: The title and detail members are similar, but detail is specific to this occurrence of the problem, whereas title is more generic
 *             detail:
 *               type: string
 *               description: A specific description of this occurrence of the problem
 *             validation:
 *               type: array
 *               description: An array of validation errors
 *               items:
 *                 $ref: '#/definitions/HttpValidationError'
 */
export class HttpError extends Error {
	public status: number;
	public title: string;
	public detail: string;
	public validation: HttpValidationError[];
	public validationErrors: ValidationError[];

	constructor(
		status: number,
		title?: string,
		detail?: string,
		validationErrors?: ValidationError[]
	) {
		super();
		Object.setPrototypeOf(this, HttpError.prototype);

		if (status) {
			this.status = status;
		}
		if (title) {
			this.title = title;
		}
		if (detail) {
			this.detail = detail;
		}
		if (validationErrors) {
			this.validationErrors = validationErrors;
		}

		this.stack = new Error().stack;
	}

	public toJson() {
		const errors: object[] = [];
		const error = { errors };
		const errorInstance = {
			status: 500,
			title: '',
			detail: '',
			validation: [] as HttpValidationError[]
		};
		errorInstance.status = this.status;
		errorInstance.title = this.title;
		errorInstance.detail = this.detail;
		if (this.validationErrors) {
			this.validation = [] as HttpValidationError[];
			for (const validationError of this.validationErrors) {
				if (validationError.target) {
					delete validationError.target;
				}
				if (validationError.children) {
					delete validationError.children;
				}
				const messages = Object.keys(validationError.constraints).map(
					key => validationError.constraints[key]
				);
				const httpValidationError: HttpValidationError = new HttpValidationError(
					validationError.property,
					messages
				);
				this.validation.push(httpValidationError);
			}
			errorInstance.validation = this.validation;
		} else {
			delete errorInstance.validation;
		}
		error.errors.push(errorInstance);
		return error;
	}
}
