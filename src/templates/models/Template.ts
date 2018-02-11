import {
	Length,
	validate,
	ValidationArguments,
	ValidationError
} from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

import { BadRequestError, HttpError } from '../../exceptions';

/**
 * @swagger
 * definitions:
 *   TemplateRequest:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       name:
 *         type: string
 *
 *   TemplateResponse:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       name:
 *         type: string
 *       createdAt:
 *         type: string
 *       updatedAt:
 *         type: string
 */
@Entity()
export default class Template {
	@PrimaryGeneratedColumn({ name: 'id' })
	public id: number;

	@Column({ name: 'name' })
	@Length(1, 255, {
		message: (args: ValidationArguments) => {
			return Template.getGenericValidationLengthMessage(args);
		}
	})
	public name: string;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	public static newTemplate(obj: { id?: number; name?: string }) {
		const newTemplate = new Template();
		if (obj.id) {
			newTemplate.id = obj.id;
		}
		if (obj.name) {
			newTemplate.name = obj.name;
		}
		return newTemplate;
	}

	public static cloneTemplate(obj: Template) {
		const newTemplate = new Template();
		if (obj.id) {
			newTemplate.id = obj.id;
		}
		if (obj.name) {
			newTemplate.name = obj.name;
		}
		return newTemplate;
	}

	public static validId(id: number): boolean {
		return id !== undefined && id > 0;
	}

	public async isValid(): Promise<boolean> {
		try {
			const errors: ValidationError[] = await validate(this, {
				validationError: { target: false, value: false }
			});
			if (errors.length > 0) {
				throw new BadRequestError(
					'Validation failed on the provided request',
					errors
				);
			}
			return true;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new BadRequestError('Unable to validate request: ' + error);
		}
	}

	public sanitize(): Template {
		// Perform data cleanup tasks here
		return this;
	}

	public static getGenericValidationLengthMessage(args: ValidationArguments) {
		return (
			'Too short, minimum length is ' +
			args.constraints[0] +
			' characters'
		);
	}
}
