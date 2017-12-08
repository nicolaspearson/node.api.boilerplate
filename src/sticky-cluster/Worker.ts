import * as cluster from 'cluster';
import * as net from 'net';
import { Inject, Service } from 'typedi';

import AppLogger from '../app/AppLogger';
import { IStickyClusterOptions } from './IStickyClusterOptions';

@Service()
export class Worker {
	@Inject() private appLogger: AppLogger;

	private ids: string[] = [];

	private running: boolean = false;

	constructor() {
		// Empty Constructor
	}

	public createWorker(index: number) {
		this.appLogger.winston.debug(`Worker: Create Worker: ${index}`);
		const workerEnv = {
			instanceNumber: index
		};
		const worker = cluster.fork(workerEnv);
		this.ids[index] = worker.id;
		this.appLogger.winston.debug(
			`Worker: Created Worker With ID: ${worker.id} maps to Index ${index}`
		);

		// Restart worker on exit
		worker.on('exit', (code, signal) => {
			this.appLogger.winston.debug(
				`Worker: Worker died with code: ${code}, and signal: ${signal}`
			);
			this.appLogger.winston.debug('Worker: Starting a new worker');
			if (this.running) {
				this.createWorker(index);
			}
		});

		this.appLogger.winston.debug(`Worker: Started worker: ${worker.id}`);
	}

	public serveWorkers(server: net.Server, options: IStickyClusterOptions) {
		// Listen for commands from the master process
		process.on('message', (message, connection) => {
			// Ignore all messages except those received from the master
			if (message === `${options.prefix}:connection`) {
				this.appLogger.winston.debug(
					`Worker: Received Connection From : ${connection.remoteAddress}`
				);

				// Emulate a connection event on the server by emitting
				// the event with the connection master sent to us
				server.emit('connection', connection);

				// Resume as we already caught the connection
				connection.resume();
			}
		});

		// Start local server
		server.listen(
			0 /* start on random port */,
			'localhost' /* accept conn from this host only */
		);
	}

	public entrust(
		index: number,
		connection: net.Socket,
		options: IStickyClusterOptions
	) {
		const id = this.ids[index];
		if (cluster.workers && id && cluster.workers[id]) {
			const worker: cluster.Worker | undefined = cluster.workers[id];
			if (worker) {
				this.appLogger.winston.debug(
					`Worker: Entrust connection ${connection.remoteAddress} to worker: ${
						id
					}`
				);
				worker.send(`${options.prefix}:connection`, connection);
			}
		}
	}

	public kill(index: number) {
		const id = this.ids[index];
		if (cluster.workers && id && cluster.workers[id]) {
			const worker: cluster.Worker | undefined = cluster.workers[id];
			if (worker) {
				this.appLogger.winston.debug(`Worker: Stop worker: ${id}`);
				worker.process.kill(/* if no argument is given, 'SIGTERM' is sent */);
			}
		}
	}

	public createAll(options: IStickyClusterOptions) {
		let i = options.concurrency;
		while (--i >= 0) {
			this.createWorker(i);
		}
	}

	public killAll(options: IStickyClusterOptions) {
		let i = options.concurrency;
		while (--i >= 0) {
			this.kill(i);
		}
	}

	public start(options: IStickyClusterOptions) {
		this.running = true;
		this.createAll(options);
	}

	public stop(options: IStickyClusterOptions) {
		if (this.running) {
			this.running = false;
			this.killAll(options);
		}
	}
}
