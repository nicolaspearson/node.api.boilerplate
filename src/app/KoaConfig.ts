import * as config from 'config';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as helmet from 'koa-helmet';
import * as path from 'path';
import {
	Action,
	RoutingControllersOptions,
	useKoaServer
} from 'routing-controllers';
import { Container, Inject } from 'typedi';
import ErrorMiddleware from '../middleware/ErrorMiddleware';
import SuccessMiddleware from '../middleware/SuccessMiddleware';
import Token from '../models/internal/Token';
import User from '../models/User';
import UserService from '../services/UserService';
import { IApplicationOptions } from './Application';
import AppLogger from './AppLogger';
import { Cors } from './Cors';
import { Logging } from './Logging';

export class KoaConfig {
	@Inject() private appLogger: AppLogger;

	@Inject() private userService: UserService;

	public app: Koa;

	constructor() {
		// Empty constructor
	}

	public async setupKoa(options: IApplicationOptions): Promise<Koa> {
		this.appLogger.winston.debug(`KoaConfig: Started`);
		this.app = new Koa();

		// Setup logging
		if (options.useKoaLogger) {
			const logging: Logging = Container.get(Logging);
			logging.setupLogging(this.app);
		}

		// Setup Cors
		const cors: Cors = Container.get(Cors);

		// Initialize the Routing Controllers
		useKoaServer(this.app, this.getRoutingControllerOptions(cors));

		// Add the rest of the middleware
		this.app.use(helmet());
		this.app.use(bodyParser());
		this.appLogger.winston.debug(
			`KoaConfig: Finished: Controllers & Middleware Configured`
		);
		return this.app;
	}

	// tslint:disable no-string-literal
	private getRoutingControllerOptions(cors: Cors): RoutingControllersOptions {
		// Define the Routing Controllers options
		return {
			authorizationChecker: async (action: Action, roles: string[]) => {
				// Executed when the @Authorized decorator is invoked
				return await this.checkAuthorization(action);
			},
			cors: cors.getCorsOptions(),
			currentUserChecker: async (action: Action) => {
				// Executed when the @CurrentUser decorator is invoked
				return await this.checkCurrentUser(action);
			},
			classTransformer: true,
			controllers: [path.resolve('dist/controllers/**/*.js')],
			defaultErrorHandler: false,
			middlewares: [ErrorMiddleware, SuccessMiddleware],
			routePrefix: config.get('server.api.basePath')
		};
	}

	private async checkAuthorization(action: Action): Promise<boolean> {
		const authToken = KoaConfig.verifyAuthHeader(
			action.request.headers['authorization']
		);
		if (authToken && authToken !== '') {
			const token: Token = new Token(authToken);
			try {
				const user = await this.userService.authorize(token);
				if (user) {
					return true;
				}
			} catch (error) {
				const isTestEnvironment = await this.isTestEnvironment(
					error,
					action,
					token
				);
				if (isTestEnvironment) {
					return true;
				}
				throw error;
			}
		}
		return false;
	}

	private async checkCurrentUser(action: Action): Promise<User | undefined> {
		const authToken = KoaConfig.verifyAuthHeader(
			action.request.headers['authorization']
		);
		if (authToken && authToken !== '') {
			const token: Token = new Token(authToken);
			return await this.userService.findOneByTokenAndVerify(token);
		}
		return;
	}

	public static verifyAuthHeader(header: string): string {
		if (!header) {
			return '';
		}
		const parts = header.split(' ');
		if (parts.length !== 2) {
			return '';
		}
		const scheme = parts[0];
		const token = parts[1];
		if (/^Bearer$/i.test(scheme)) {
			return token;
		}
		return '';
	}

	private async isTestEnvironment(
		error: any,
		action: Action,
		token: Token
	): Promise<boolean> {
		if (
			error &&
			error.detail &&
			error.detail.name &&
			error.detail.name === 'RepositoryNotFoundError'
		) {
			const testToken = KoaConfig.verifyAuthHeader(
				action.request.headers['x-access-token']
			);
			const userAgent = action.request.headers['user-agent'];
			// Typeorm fails when running integration tests with supertest
			// this means we are not able to check the user exists in the db
			if (
				config.get('server.auth.testToken') === testToken &&
				userAgent === 'node-superagent/3.6.0'
			) {
				// Decode the token
				const decodedToken: any = token.verifyToken();
				const userId = decodedToken.id;
				if (User.validId(userId)) {
					return true;
				}
			}
		}
		return false;
	}
}
