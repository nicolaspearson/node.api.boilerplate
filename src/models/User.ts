import * as bcrypt from 'bcrypt';
import {
	IsEmail,
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

import { BadRequestError, HttpError } from '../exceptions';

/**
 * @swagger
 * definitions:
 *   UserRequest:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       username:
 *         type: string
 *       emailAddress:
 *         type: string
 *       password:
 *         type: string
 *       enabled:
 *         type: boolean
 *       lastLoggedInAt:
 *         type: string
 *
 *   UserResponse:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       username:
 *         type: string
 *       emailAddress:
 *         type: string
 *       enabled:
 *         type: boolean
 *       lastLoggedInAt:
 *         type: string
 *       createdAt:
 *         type: string
 *       updatedAt:
 *         type: string
 */
@Entity()
export default class User {
	@PrimaryGeneratedColumn({ name: 'id' })
	public id: number;

	@Column({ name: 'username' })
	@Length(3, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public username: string;

	@Column({ name: 'email_address' })
	@IsEmail(
		{},
		{
			message: 'Must be a valid email address'
		}
	)
	public emailAddress: string;

	@Column({ name: 'password' })
	@Length(6, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public password: string;

	@Column({ name: 'enabled' })
	public enabled: boolean;

	@Column({ name: 'last_logged_in_at' })
	public lastLoggedInAt: Date;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	public static newUser(obj: {
		id?: number;
		username?: string;
		emailAddress?: string;
		password?: string;
		enabled?: boolean;
		lastLoggedInAt?: Date;
	}) {
		const newUser = new User();
		if (obj.id) {
			newUser.id = obj.id;
		}
		if (obj.username) {
			newUser.username = obj.username;
		}
		if (obj.emailAddress) {
			newUser.emailAddress = obj.emailAddress;
		}
		if (obj.password) {
			newUser.password = obj.password;
		}
		if (obj.enabled) {
			newUser.enabled = obj.enabled;
		}
		if (obj.lastLoggedInAt) {
			newUser.lastLoggedInAt = obj.lastLoggedInAt;
		}
		return newUser;
	}

	public static cloneUser(obj: User) {
		const newUser = new User();
		if (obj.id) {
			newUser.id = obj.id;
		}
		if (obj.username) {
			newUser.username = obj.username;
		}
		if (obj.emailAddress) {
			newUser.emailAddress = obj.emailAddress;
		}
		if (obj.password) {
			newUser.password = obj.password;
		}
		if (obj.enabled) {
			newUser.enabled = obj.enabled;
		}
		if (obj.lastLoggedInAt) {
			newUser.lastLoggedInAt = obj.lastLoggedInAt;
		}
		return newUser;
	}

	public static async encryptPassword(password: string): Promise<string> {
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(password, salt);
			return hash;
		} catch (error) {
			return error;
		}
	}

	public async encryptUserPassword(): Promise<string> {
		try {
			this.password = await User.encryptPassword(this.password);
			return this.password;
		} catch (error) {
			return error;
		}
	}

	public async validatePassword(password: string): Promise<boolean> {
		try {
			const isMatch = await bcrypt.compare(password, this.password);
			return isMatch;
		} catch (error) {
			return error;
		}
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

	public sanitize(): User {
		delete this.password;
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
