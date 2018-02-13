import * as cluster from 'cluster';
import * as config from 'config';
import * as http from 'http';
import * as Koa from 'koa';
import * as os from 'os';
import { Container, Inject, Service } from 'typedi';

import { HttpError } from '../exceptions';
import User from '../models/User';
import UserService from '../services/UserService';
import { StickyCluster } from '../sticky-cluster/StickyCluster';
import { SystemUtils } from '../utils/SystemUtils';
import { Application, IApplicationOptions } from './Application';
import AppLogger from './AppLogger';
import { Database } from './Database';
import { KoaConfig } from './KoaConfig';
import { Sockets } from './Socket';

@Service()
export class WebServer {
	@Inject() private appLogger: AppLogger;

	@Inject() private stickyCluster: StickyCluster;

	@Inject() private userService: UserService;

	private port: number;

	private host: string;

	constructor() {
		// Set the port
		this.port = Number(config.get('server.api.port'));

		// Set the host
		this.host = String(config.get('server.api.host'));

		// Set the api url
		Application.apiUrl = `${config.get(
			'server.api.protocol'
		)}://${config.get('server.api.host')}`;

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
			await this.createWebServerInstance(this.port, this.host);
			await this.createWorkerBackgroundServices(Application.server);
			return;
		} else {
			const numWorkers: number = os.cpus().length;
			this.stickyCluster.startCluster(
				async (callback: () => {}) => {
					callback();
				},
				async (callback: (server: http.Server) => {}) => {
					const app: Koa = await this.createWebServerInstance(
						this.port
					);
					Application.server = http.createServer(app.callback());

					await this.createWorkerBackgroundServices(
						Application.server
					);

					callback(Application.server);
				},
				{
					prefix: 'nab-sticky-cluster',
					concurrency: numWorkers,
					port: this.port,
					hardShutdownDelay: 60 * 1000
				}
			);
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
		port?: number,
		host?: string
	): Promise<Koa> {
		const app = await this.startWebServer();
		if (port && port > 0 && host) {
			Application.server = app.listen(port, host, this.webServerListener);
			return app;
		}
		return app;
	}

	private async startWebServer(): Promise<Koa> {
		// Configure the webserver
		const koaConfig: KoaConfig = Container.get(KoaConfig);
		Application.app = await koaConfig.setupKoa(Application.options);

		// Connect to the database
		const database: Database = Container.get(Database);
		await database.setupDatabase(Application.app);

		return Application.app;
	}

	private async createSingleThreadedBackgroundServices() {
		// Wait for 1 second for the web server
		this.appLogger.winston.debug(
			`WebServer: Initializing single threaded background services in 1 second...`
		);
		await SystemUtils.sleep(1000);
	}

	private async createWorkerBackgroundServices(server: http.Server) {
		// Wait for 1 second for the web server
		this.appLogger.winston.debug(
			`WebServer: Initializing worker background services in 1 second...`
		);
		await SystemUtils.sleep(1000);
		const user: User | undefined = await this.createUser();
		await this.startSockets(server, user);

		// Start single threaded background services on the 1st worker
		if (
			Boolean(config.get('server.cluster')) === false ||
			(cluster &&
				cluster.worker &&
				cluster.worker.id &&
				Number(cluster.worker.id) === 1)
		) {
			this.createSingleThreadedBackgroundServices();
		}
	}

	private async createUser(): Promise<User | undefined> {
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
				user.enabled = true;
				await this.userService.save(user);
			} else {
				this.appLogger.winston.error(`WebServer: User Already Exists`);
			}
			return user;
		} catch (error) {
			if (error instanceof HttpError) {
				if (String(error.detail).includes('ER_DUP_ENTRY')) {
					this.appLogger.winston.error(
						`WebServer: User Already Inserted`
					);
				} else {
					let parsedError: any = error;
					if (error && error.detail) {
						parsedError = error.detail;
					}
					this.appLogger.winston.error(
						`WebServer: User Not Inserted. Local Error`,
						parsedError &&
						parsedError.detail &&
						parsedError.detail.config
							? parsedError.detail.config
							: parsedError
					);
				}
			} else {
				this.appLogger.winston.error(
					`WebServer: User Not Inserted`,
					error && error.detail && error.detail.config
						? error.detail.config
						: error
				);
			}
		}
	}

	private async startSockets(server: http.Server, user: User | undefined) {
		// Start Websockets
		const sockets: Sockets = Container.get(Sockets);
		await sockets.setupSockets(server);
		sockets.setupSocketClient(user);
	}
}
