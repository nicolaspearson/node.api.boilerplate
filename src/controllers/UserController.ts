import * as config from 'config';
import {
	Authorized,
	Body,
	BodyParam,
	CurrentUser,
	Delete,
	Get,
	HeaderParam,
	JsonController,
	Param,
	Post,
	Put
} from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { BadRequestError, UnauthorizedError } from '../exceptions';
import SearchTerm from '../models/internal/SearchTerm';
import User from '../models/User';
import UserService from '../services/UserService';

/**
 * @swagger
 * tags:
 *   name: user
 *   description: User
 */
@Service()
@JsonController()
export default class UserController {
	@Inject() private userService: UserService;

	constructor(userService: UserService) {
		// Override the injected service
		if (userService) {
			this.userService = userService;
		}
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *   get:
	 *     summary: Find a specific user
	 *     description: Retrieves a specific user from the database
	 *     operationId: findUserById
	 *     tags: [user]
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *       - name: id
	 *         in: path
	 *         description: id of the user
	 *         required: true
	 *         type: integer
	 *         format: int32
	 *     responses:
	 *       200:
	 *         description: The found user
	 *         schema:
	 *           $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Get('/users/:id')
	@Authorized()
	public async findUserById(@Param('id') id: number): Promise<User> {
		return await this.userService.findOneById(id);
	}

	/**
	 * @swagger
	 * /users/search:
	 *   post:
	 *     summary: Search users
	 *     description: Search for an array of users, based on the provided arguments
	 *     operationId: searchUsers
	 *     tags: [user]
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *       - name: body
	 *         in: body
	 *         description: the request body
	 *         schema:
	 *           required:
	 *             - terms
	 *             - limit
	 *           type: object
	 *           properties:
	 *             limit:
	 *               description: the number of records to fetch, 0 for all
	 *               type: number
	 *             terms:
	 *               description: an array of search terms
	 *               type: array
	 *               items:
	 *                 $ref: '#/definitions/SearchTermRequest'
	 *     responses:
	 *       200:
	 *         description: An array of users
	 *         schema:
	 *           type: array
	 *           items:
	 *             $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Post('/users/search')
	@Authorized()
	public async searchUsers(
		@BodyParam('limit') limit: number,
		@BodyParam('terms') terms: SearchTerm[]
	): Promise<User[]> {
		return await this.userService.search(limit, terms);
	}

	/**
	 * @swagger
	 * /users:
	 *   post:
	 *     summary: Save a new user
	 *     description: Saves a new user to the database
	 *     operationId: saveUser
	 *     tags: [user]
	 *     consumes:
	 *       - application/json
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: x-access-token
	 *         in: header
	 *         description: api access token
	 *         required: true
	 *         type: string
	 *       - name: user
	 *         in: body
	 *         description: the user
	 *         required: true
	 *         schema:
	 *           $ref: '#/definitions/UserRequest'
	 *     responses:
	 *       200:
	 *         description: The saved user
	 *         schema:
	 *           $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Post('/users')
	public async saveUser(
		@HeaderParam('x-access-token') accessToken: string,
		@Body({ validate: false })
		user: User
	): Promise<User> {
		if (
			!accessToken ||
			!(accessToken === config.get('server.auth.accessToken'))
		) {
			throw new UnauthorizedError('Invalid API token');
		}
		return await this.userService.save(user);
	}

	/**
	 * @swagger
	 * /users/changePassword:
	 *   post:
	 *     summary: Change a users password
	 *     description: Changes an existing user's password
	 *     operationId: changePassword
	 *     tags: [user]
	 *     consumes:
	 *       - application/json
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *       - name: body
	 *         in: body
	 *         required: true
	 *         schema:
	 *           type: object
	 *           properties:
	 *             newPassword:
	 *               description: the user's new password
	 *               type: string
	 *             user:
	 *               $ref: '#/definitions/UserRequest'
	 *     responses:
	 *       200:
	 *         description: The updated user
	 *         schema:
	 *           type: object
	 *           properties:
	 *             user:
	 *               $ref: '#/definitions/UserResponse'
	 *             token:
	 *               $ref: '#/definitions/TokenResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Post('/users/changePassword')
	@Authorized()
	public async changePassword(
		@BodyParam('newPassword') newPassword: string,
		@BodyParam('user', { validate: false })
		user: User
	): Promise<object> {
		if (!user || !newPassword) {
			throw new BadRequestError(
				'The required parameters were not supplied.'
			);
		}
		return await this.userService.changePassword(user, newPassword);
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *   put:
	 *     summary: Updates a specific user
	 *     description: Updates a specific user on the database
	 *     operationId: updateUser
	 *     tags: [user]
	 *     consumes:
	 *       - application/json
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *       - name: id
	 *         in: path
	 *         description: id of the user
	 *         required: true
	 *         type: integer
	 *         format: int32
	 *       - name: user
	 *         in: body
	 *         description: the user
	 *         required: true
	 *         schema:
	 *           $ref: '#/definitions/UserRequest'
	 *     responses:
	 *       200:
	 *         description: The updated user
	 *         schema:
	 *           $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Put('/users/:id')
	@Authorized()
	public async updateUser(
		@Param('id') id: number,
		@Body({ validate: false })
		user: User
	): Promise<User> {
		if (!user || String(id) !== String(user.id)) {
			throw new BadRequestError(
				'An id mismatch error occurred. The id supplied in the url parameter does not match the supplied object'
			);
		}
		return await this.userService.update(user);
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *   delete:
	 *     summary: Deletes a specific user
	 *     description: Removes a specific user from the database
	 *     operationId: deleteUser
	 *     tags: [user]
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *       - name: id
	 *         in: path
	 *         description: id of the user
	 *         required: true
	 *         type: integer
	 *         format: int32
	 *     responses:
	 *       200:
	 *         description: The deleted user
	 *         schema:
	 *           $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Delete('/users/:id')
	@Authorized()
	public async deleteUser(@Param('id') id: number): Promise<User> {
		return await this.userService.delete(id);
	}

	/**
	 * @swagger
	 * /users/login:
	 *   post:
	 *     summary: Authenticates a specific user
	 *     description: Authenticates the provided user on the database using username / email address and password
	 *     operationId: loginUser
	 *     tags: [user]
	 *     consumes:
	 *       - application/json
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: x-access-token
	 *         in: header
	 *         description: api access token
	 *         required: true
	 *         type: string
	 *       - name: loginRequest
	 *         in: body
	 *         description: The users login credentials
	 *         required: true
	 *         schema:
	 *           type: object
	 *           properties:
	 *             username:
	 *               description: username of the user
	 *               type: string
	 *             emailAddress:
	 *               description: email address of the user
	 *               type: string
	 *             password:
	 *               type: string
	 *               description: password of the user
	 *     responses:
	 *       200:
	 *         description: An user and token object
	 *         schema:
	 *           type: object
	 *           properties:
	 *             user:
	 *               $ref: '#/definitions/UserResponse'
	 *             token:
	 *               $ref: '#/definitions/TokenResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Post('/users/login')
	public async loginUser(
		@HeaderParam('x-access-token') accessToken: string,
		@BodyParam('username', { required: false })
		username: string,
		@BodyParam('emailAddress', { required: false })
		emailAddress: string,
		@BodyParam('password') password: string
	): Promise<object> {
		if (
			!accessToken ||
			!(accessToken === config.get('server.auth.accessToken'))
		) {
			throw new UnauthorizedError('Invalid API token');
		}
		return await this.userService.login(username, password, emailAddress);
	}

	/**
	 * @swagger
	 * /users/health:
	 *   get:
	 *     summary: Checks if a token is still valid
	 *     description: Checks if the provided token is still valid
	 *     operationId: userHealth
	 *     tags: [user]
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: Authorization
	 *         in: header
	 *         description: jwt access token
	 *         required: true
	 *         type: string
	 *     responses:
	 *       200:
	 *         description: The validated user
	 *         schema:
	 *           $ref: '#/definitions/UserResponse'
	 *       400:
	 *         $ref: '#/responses/BadRequest'
	 *       401:
	 *         $ref: '#/responses/Unauthorized'
	 *       403:
	 *         $ref: '#/responses/Forbidden'
	 *       404:
	 *         $ref: '#/responses/NotFound'
	 *       405:
	 *         $ref: '#/responses/MethodNotAllowed'
	 *       406:
	 *         $ref: '#/responses/NotAcceptable'
	 *       500:
	 *         $ref: '#/responses/InternalServerError'
	 *       504:
	 *         $ref: '#/responses/GatewayTimeout'
	 *       default:
	 *         $ref: '#/responses/DefaultError'
	 */
	@Get('/users/health')
	@Authorized()
	public async userHealth(
		@CurrentUser({ required: true })
		user: User
	): Promise<User> {
		if (user) {
			return user.sanitize();
		}
		throw new UnauthorizedError('Invalid Token');
	}
}
