import * as net from 'net';
import { Inject, Service } from 'typedi';

import AppLogger from '../app/AppLogger';
import { IStickyClusterOptions } from './IStickyClusterOptions';
import { stringHash } from './StringHash';
import { Worker } from './Worker';

@Service()
export class Master {
	@Inject() private appLogger: AppLogger;

	@Inject() private workers: Worker;

	private connections: any = {};

	private serverInstance: net.Server;

	constructor() {
		// Empty Constructor
	}

	public createServer(options: IStickyClusterOptions): net.Server {
		this.appLogger.winston.debug(`Master: Create`);
		return net.createServer({ pauseOnConnect: true }, connection => {
			// Manage connections map
			const signature: string =
				connection.remoteAddress + ':' + connection.remotePort;
			this.connections[signature] = connection;
			connection.on('close', () => {
				delete this.connections[signature];
			});

			// Choose a worker
			const index =
				stringHash(connection.remoteAddress || '') %
				options.concurrency;
			this.workers.entrust(index, connection, options);
		});
	}

	public serverStart(callback: () => void, options: IStickyClusterOptions) {
		this.serverInstance = this.createServer(options).on('error', error => {
			this.appLogger.winston.error(`Master: Error on server`, error);
		});
		this.serverInstance.listen(options.port, callback);
	}

	public serverStop(callback: () => void) {
		// Stop listening for new connections
		this.serverInstance.close((error: any) => {
			if (error) {
				this.appLogger.winston.error(
					`Master: Error stopping server`,
					error
				);
			} else {
				return callback();
			}
		});

		this.appLogger.winston.debug(
			`Master: Destroying Active Connections...`
		);
		Object.keys(this.connections).forEach(signature => {
			this.connections[signature].destroy();
		});
	}

	public stop(options: IStickyClusterOptions) {
		// Stop gracefully
		this.appLogger.winston.debug(`Master: Stop`);
		this.serverStop(() => {
			this.appLogger.winston.debug(`Master: Stop Workers`);
			this.workers.stop(options);
			this.appLogger.winston.debug(`Master: Stopped`);
		});

		// Forced Stop
		setTimeout(() => {
			this.appLogger.winston.debug(`Master: Stop Workers`);
			this.workers.stop(options);
			this.appLogger.winston.debug(`Master: Killed`);
			process.exit(1);
		}, options.hardShutdownDelay).unref();
	}

	public start(options: IStickyClusterOptions) {
		this.appLogger.winston.debug(`Master: Start`);
		this.serverStart(() => {
			this.appLogger.winston.debug(
				`Master: Started on Port: ${options.port}`
			);
			this.appLogger.winston.debug(`Master: Starting Workers`);
			this.workers.start(options);
			process.once('SIGINT', () => {
				this.stop(options);
			});
		}, options);
	}
}
