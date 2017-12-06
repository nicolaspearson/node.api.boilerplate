import 'reflect-metadata';
import 'source-map-support/register';
import 'ts-helpers';

import * as cluster from 'cluster';
import * as config from 'config';
import * as farmhash from 'farmhash';
import * as Koa from 'koa';
import * as net from 'net';
import * as os from 'os';
import { Container, Inject, Service } from 'typedi';

import { HttpError } from '../exceptions/index';
import User from '../models/User';
import UserService from '../services/UserService';
import { SystemUtils } from '../utils/SystemUtils';
import { Application, IApplicationOptions } from './Application';
import AppLogger from './AppLogger';
import { Database } from './Database';
import { KoaConfig } from './KoaConfig';
import { Sockets } from './Socket';

@Service()
export class WebServer {
	@Inject() private appLogger: AppLogger;

	@Inject() private userService: UserService;

	private port: number;

	private host: string;

	private connectionKey: string = 'sticky-session:connection';

	constructor() {
		// Set the port
		this.port = Number(config.get('server.api.port'));

		// Set the host
		this.host = String(config.get('server.api.host'));

		// Set the api url
		Application.apiUrl = `${config.get('server.api.protocol')}://${config.get(
			'server.api.host'
		)}`;

		if (Number(config.get('server.api.port') > 999)) {
			Application.apiUrl = `${Application.apiUrl}:${config.get(
				'server.api.port'
			)}`;
		}

		Application.apiUrl = `${Application.apiUrl}${config.get(
			'server.api.basePath'
		)}`;
	}

	public async setupWebServer(options: IApplicationOptions): Promise<void> {
		this.appLogger.winston.debug('WebServer: Configuration Started');

		const clustering: boolean = Boolean(config.get('server.cluster'));
		if (!clustering) {
			await this.createWebServerInstance('Main', this.port, this.host);
			await this.createBackgroundServices('Main');
			return;
		}

		const numWorkers: number = os.cpus().length;
		if (cluster.isMaster) {
			this.appLogger.winston.debug(
				`WebServer: Master cluster setting up ${numWorkers} workers...`
			);

			const workers: cluster.Worker[] = [];

			const spawn = (index: number) => {
				const workerEnv = {
					workerName: `Worker ${index + 1}`,
					instanceNumber: index + 1
				};
				workers[index] = cluster.fork(workerEnv);

				// Restart worker on exit
				workers[index].on('exit', (code, signal) => {
					this.appLogger.winston.debug(
						`WebServer: Worker died with code: ${code}, and signal: ${signal}`
					);
					this.appLogger.winston.debug('WebServer: Starting a new worker');
					spawn(index);
				});
			};

			for (let i = 0; i < numWorkers; i++) {
				spawn(i);
			}

			// Helper function for getting a worker index based on IP address.
			// This is a hot path so it should be really fast. The way it works
			// is by converting the IP address to a number by removing non numeric
			// characters, then compressing it to the number of slots we have.
			//
			// Compared against "real" hashing (from the sticky-session code) and
			// "real" IP number conversion, this function is on par in terms of
			// worker index distribution only much faster.
			const workerIndex = (ipAddress: string, length: number) => {
				return farmhash.fingerprint32(ipAddress[length - 1]) % length;
			};

			// Create the outside facing server listening on our port.
			Application.server = net
				.createServer({ pauseOnConnect: true }, connection => {
					// We received a connection and need to pass it to the appropriate
					// worker. Get the worker for this connection's source IP and pass
					// it the connection.
					if (connection && connection.remoteAddress) {
						const worker =
							workers[workerIndex(connection.remoteAddress, numWorkers)];
						worker.send(this.connectionKey, connection);
					}
				})
				.listen(this.port, this.host, this.webServerListener);
		} else {
			const instanceNumber = Number(process.env.instanceNumber);
			const workerName = process.env.workerName || `Worker ${instanceNumber}`;
			this.appLogger.winston.debug(
				`WebServer: Workers: ${numWorkers} | Worker Name: ${workerName}`
			);
			if (numWorkers === instanceNumber) {
				await this.createWebServerInstance('Main');
				await this.createBackgroundServices('Main');
			} else {
				await this.createWebServerInstance(workerName);
			}
		}

		return;
	}

	private webServerListener = () => {
		this.appLogger.winston.debug(`
		------------------------------------------------
		Server Started:
		------------------------------------------------
		Cluster: 	${config.get('server.cluster')}
		API URL:	${Application.apiUrl}
		API Docs: 	${Application.apiUrl}/${config.get('server.api.docs')}.json
		------------------------------------------------
		`);
	};

	private async createWebServerInstance(
		workerName: string,
		port?: number,
		host?: string
	) {
		const app = await this.startWebServer(workerName);
		if (port && port > 0 && host) {
			Application.server = app.listen(port, host, this.webServerListener);
			return;
		}
		// Don't expose our internal server to the outside.
		const server = app.listen(0, 'localhost');

		// Listen to messages sent from the master. Ignore everything else.
		process.on('message', (message, connection) => {
			if (message !== this.connectionKey) {
				return;
			}

			// Emulate a connection event on the server by emitting the
			// event with the connection the master sent us.
			server.emit('connection', connection);

			connection.resume();
		});
	}

	private async startWebServer(workerName: string): Promise<Koa> {
		// Configure the webserver
		const koaConfig: KoaConfig = Container.get(KoaConfig);
		Application.app = await koaConfig.setupKoa(Application.options, workerName);

		// Connect to the database
		const database: Database = Container.get(Database);
		await database.setupDatabase(Application.app, workerName);

		return Application.app;
	}

	private async createBackgroundServices(workerName: string) {
		// Wait for 1 second for the web server
		this.appLogger.winston.debug(
			`WebServer: ${
				workerName
			}: Initializing background services in 1 second...`
		);
		await SystemUtils.sleep(1000);
		const user: User | undefined = await this.createUser(workerName);
		await this.startSockets(workerName, user);
	}

	private async createUser(workerName: string): Promise<User | undefined> {
		let user: User | undefined;
		// Find user
		try {
			user = await this.userService.findOneByFilter({
				where: { username: config.get('server.user.username') }
			});
		} catch (error) {
			// User does not exist
			user = undefined;
		}

		// Insert the user
		try {
			if (!user) {
				user = User.newUser({
					username: config.get('server.user.username'),
					password: config.get('server.user.password'),
					emailAddress: config.get('server.user.email')
				});
				await this.userService.save(user);
			} else {
				this.appLogger.winston.error(
					`WebServer: ${workerName}: User Already Exists`
				);
			}
			return user;
		} catch (error) {
			if (error instanceof HttpError) {
				if (String(error.detail).includes('ER_DUP_ENTRY')) {
					this.appLogger.winston.error(
						`WebServer: ${workerName}: User Already Inserted`
					);
				} else {
					let parsedError: any = error;
					if (error && error.detail) {
						parsedError = error.detail;
					}
					this.appLogger.winston.error(
						`WebServer: ${workerName}: User Not Inserted. Local Error`,
						parsedError && parsedError.detail && parsedError.detail.config
							? parsedError.detail.config
							: parsedError
					);
				}
			} else {
				this.appLogger.winston.error(
					`WebServer: ${workerName}: User Not Inserted`,
					error && error.detail && error.detail.config
						? error.detail.config
						: error
				);
			}
		}
	}

	private async startSockets(workerName: string, user: User | undefined) {
		// Start Websockets
		const sockets: Sockets = Container.get(Sockets);
		await sockets.setupSockets(Application.server, workerName);
		sockets.setupSocketClient(user);
	}
}
