import * as config from 'config';
import { defaultMetadataRegistry } from 'event-dispatch/MetadataRegistry';
import * as glob from 'glob';
import { Server as HttpServer } from 'http';
import * as jwt from 'jsonwebtoken';
import { Server as NetServer } from 'net';
import * as path from 'path';
import * as ioServer from 'socket.io';
import * as ioClient from 'socket.io-client';
import { Inject } from 'typedi';

import Token from '../models/internal/Token';
import User from '../models/User';
import UserService from '../services/UserService';
import AppLogger from './AppLogger';

/**
 * In order to debug socket.io server event
 * execute the commands below in your terminal:
 *
 * Turn on debugging:
 * export DEBUG=socket.io:*
 *
 * Turn off debugging:
 * export DEBUG=socket.io:
 */
export class Sockets {
	@Inject() private appLogger: AppLogger;

	@Inject() private userService: UserService;

	private static socketServer: SocketIO.Server;

	private static socketClient: SocketIOClient.Socket;

	// Include subscribers dynamically
	private subscribers = glob.sync('./dist/subscribers/*.js');

	constructor() {
		this.subscribers.map(f => {
			return require(path.resolve(f));
		});
	}

	public static getSocketServer(): SocketIO.Server {
		return Sockets.socketServer;
	}

	public static getSocketClient(): SocketIOClient.Socket {
		return Sockets.socketClient;
	}

	public async setupSockets(
		server: HttpServer | NetServer,
		workerName: string
	): Promise<SocketIO.Server> {
		Sockets.socketServer = ioServer(
			config.get('server.socket.port'),
			this.getSocketServerOptions()
		);

		const jwtSecret: string = config.get('server.auth.jwtSecret');

		Sockets.socketServer
			.use((socket, next) => {
				if (socket.handshake.query && socket.handshake.query.token) {
					jwt.verify(
						socket.handshake.query.token,
						jwtSecret,
						async (err: any, decoded: any) => {
							if (err) {
								return next(new Error('Authentication error'));
							}
							try {
								await this.userService.authorize(
									new Token(socket.handshake.query.token)
								);
							} catch (error) {
								this.appLogger.winston.error(
									`Sockets: ${workerName}: Auth Error`,
									error
								);
								return next(new Error('Authentication error'));
							}
							next();
						}
					);
				}
			})
			.on('connection', socket => {
				this.appLogger.winston.debug(`Sockets: Authenticated: ${socket.id}`);
				// Bind applicable subscribers to the socket
				defaultMetadataRegistry.collectEventsHandlers.forEach(
					(eventHandler: any) => {
						const eventNamesForThisHandler = Object.keys(eventHandler);
						eventNamesForThisHandler.forEach(eventName => {
							const callback = eventHandler[eventName];
							socket.on(eventName, data => {
								callback(Object.assign({ socket }, data));
							});
						});
					}
				);
			});

		this.appLogger.winston.debug(
			`Sockets: ${workerName}: Web Sockets Initialized`
		);

		return Sockets.socketServer;
	}

	private getSocketServerOptions(): SocketIO.ServerOptions {
		return {
			path: config.get('server.socket.path')
		};
	}

	public setupSocketClient(user: User | undefined) {
		const socketServerUrl = `http://${config.get(
			'server.socket.host'
		)}:${config.get('server.socket.port')}`;
		const socketServerPath: string = config.get('server.socket.path');

		const token: Token = new Token();
		const userId = user ? user.id : 1;
		token.generateToken(userId);
		Sockets.socketClient = ioClient.connect(socketServerUrl, {
			path: socketServerPath,
			query: { token: token.token }
		});

		Sockets.socketClient.on('connect', () => {
			Sockets.socketClient
				.emit('authenticate', { token })
				.on('authenticated', () => {
					this.appLogger.winston.debug('Sockets: Client: Authenticated');
				})
				.on('unauthorized', (msg: any) => {
					this.appLogger.winston.error(`Sockets: Unauthorized`, msg);
				});

			Sockets.socketClient.on('error', (msg: any) => {
				this.appLogger.winston.error(`Sockets: Error`, msg);
			});

			Sockets.socketClient.emit('started', {
				message: `Socket server is listening on: ${socketServerUrl}${
					socketServerPath
				}`
			});
		});
	}
}
