import { JsonWebTokenError } from 'jsonwebtoken';
import * as moment from 'moment';
import { Inject } from 'typedi';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import {
	BadRequestError,
	HttpError,
	InternalServerError,
	NotFoundError,
	UnauthorizedError
} from '../exceptions';
import SearchTerm from '../models/internal/SearchTerm';
import Token from '../models/internal/Token';
import { ISearchQueryBuilderOptions } from '../models/options/ISearchQueryBuilderOptions';
import User from '../models/User';
import UserRepository from '../repositories/UserRepository';
import BaseService from './BaseService';

export default class UserService extends BaseService {
	@Inject() private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		super();
		// Override the injected repository
		if (userRepository) {
			this.userRepository = userRepository;
		}
	}

	public async authorize(token: Token): Promise<User> {
		try {
			const userResult: User = await this.findOneByTokenAndVerify(token);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new UnauthorizedError('Invalid token');
		}
	}

	public async login(
		username: string,
		password: string,
		emailAddress?: string
	): Promise<object> {
		try {
			// Fetch the user from the database
			let userResult: User;
			try {
				if (emailAddress) {
					// Use the email address if provided
					userResult = await this.userRepository.findOneByFilter({
						where: {
							email_address: emailAddress
						}
					});
				} else if (username) {
					// Fallback to the username
					userResult = await this.userRepository.findOneByFilter({
						where: {
							username
						}
					});
				} else {
					throw new UnauthorizedError('Invalid credentials supplied');
				}
			} catch (error) {
				throw new UnauthorizedError('Invalid credentials supplied');
			}

			// Validate the input parameters
			const userValidate: User = User.cloneUser(userResult);
			userValidate.password = password || '';
			await userValidate.isValid();

			// Validate the provided password
			const valid = await userResult.validatePassword(password);
			if (!valid) {
				throw new UnauthorizedError('Invalid credentials supplied');
			}

			// Create a token
			const newToken: Token = new Token();
			newToken.generateToken(userResult.id);

			// Update the logged in timestamp
			userResult.lastLoggedInAt = moment().toDate();
			this.update(userResult);

			// Return the created token
			return { token: newToken.token, user: userResult.sanitize() };
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findAll(): Promise<User[]> {
		try {
			const users: User[] = await this.userRepository.getAll();
			const sanitizedUsers = users.map((user: User) => {
				user.sanitize();
				return user;
			});
			return sanitizedUsers;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findAllByFilter(
		filter: FindManyOptions<User>
	): Promise<User[]> {
		try {
			const users: User[] = await this.userRepository.findManyByFilter(
				filter
			);
			const sanitizedUsers = users.map((user: User) => {
				user.sanitize();
				return user;
			});
			return sanitizedUsers;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneById(id: number): Promise<User> {
		try {
			if (!User.validId(id) || isNaN(id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			const userResult: User = await this.userRepository.findOneById(id);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneByTokenAndVerify(token: Token): Promise<User> {
		try {
			// Decode the token
			const decodedToken: any = token.verifyToken();
			const userId = decodedToken.id;
			if (!User.validId(userId)) {
				throw new UnauthorizedError('Invalid token');
			}
			// Fetch the user from the database
			const userResult: User = await this.userRepository.findOneByFilter({
				where: {
					id: userId
				}
			});
			if (!userResult) {
				throw new UnauthorizedError('Invalid token');
			}
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new UnauthorizedError('Invalid token');
			}
			if (error instanceof HttpError) {
				if (error instanceof NotFoundError) {
					throw new UnauthorizedError('Invalid token');
				}
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneByFilter(filter: FindOneOptions<User>): Promise<User> {
		try {
			const userResult: User = await this.userRepository.findOneByFilter(
				filter
			);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<User> {
		try {
			const userResult = await this.userRepository.findOneWithQueryBuilder(
				options
			);
			if (userResult) {
				return userResult.sanitize();
			} else {
				throw new NotFoundError(
					'The requested object could not be found'
				);
			}
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findManyWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<User[]> {
		try {
			const results = await this.userRepository.findManyWithQueryBuilder(
				options
			);
			const sanitizedResults = results.map((user: User) => {
				user.sanitize();
				return user;
			});
			return sanitizedResults;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async search(limit: number, searchTerms: SearchTerm[]) {
		try {
			const filter = this.getSearchFilter(limit, searchTerms);
			return await this.findManyWithQueryBuilder(filter);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async save(user: User): Promise<User> {
		try {
			// Check if the user is valid
			const userIsValid = await user.isValid();
			if (!userIsValid) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Encrypt the users password
			await user.encryptUserPassword();
			// Save the user to the database
			const userResult: User = await this.userRepository.save(user);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async update(user: User): Promise<User> {
		try {
			// Check if the user is valid
			const userIsValid = await user.isValid();
			if (!userIsValid || !User.validId(user.id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Do not allow the password to be updated with this method
			delete user.password;
			// Update the user on the database
			const userResult: User = await this.userRepository.updateOneById(
				user.id,
				user
			);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async changePassword(
		user: User,
		newPassword: string
	): Promise<object> {
		try {
			// Check if the user is valid
			const userIsValid = await user.isValid();
			if (
				!userIsValid ||
				!User.validId(user.id) ||
				!user.password ||
				!newPassword
			) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}

			// Fetch the user from the database
			const userResult: User = await this.userRepository.findOneByFilter({
				where: {
					username: user.username
				}
			});

			// Validate the input parameters
			const userValidate: User = User.cloneUser(userResult);
			userValidate.password = user.password || '';
			await userValidate.isValid();

			// Validate the provided password
			const valid = await userResult.validatePassword(user.password);
			if (!valid) {
				throw new UnauthorizedError('Invalid password');
			}

			// Encrypt the users new password
			userResult.password = newPassword;
			await userResult.encryptUserPassword();

			// Update the user on the database
			const userUpdateResult: User = await this.userRepository.updateOneById(
				userResult.id,
				userResult
			);
			return await this.login(
				userUpdateResult.username,
				newPassword,
				userUpdateResult.emailAddress
			);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async delete(id: number): Promise<User> {
		try {
			if (!User.validId(id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			const userResult: User = await this.userRepository.deleteOneWithId(
				id
			);
			return userResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}
}
