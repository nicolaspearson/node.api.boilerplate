import * as cluster from 'cluster';
import * as config from 'config';
import * as moment from 'moment';
import { Service } from 'typedi';
import * as winston from 'winston';

@Service()
export default class AppLogger {
	private winstonInstance: winston.LoggerInstance;

	constructor() {
		if (!this.winstonInstance) {
			this.setupAppLogger();
		}
	}

	public get winston(): winston.LoggerInstance {
		return this.winstonInstance;
	}

	public set winston(winstonInstance: winston.LoggerInstance) {
		this.winstonInstance = winstonInstance;
	}

	private setupAppLogger() {
		// Configure levels and transports, and set local variable
		this.winston = new winston.Logger({
			levels: this.getCustomLogLevels().levels,
			transports: [
				new winston.transports.Console({
					timestamp: () => {
						return new Date().toISOString();
					},
					formatter: options => {
						// Format the output
						const workerName =
							cluster && cluster.worker && cluster.worker.id
								? `[Worker-ID: ${cluster.worker.id}] - `
								: '[Main-Instance] - ';
						return (
							moment(options.timestamp()).format(
								'YYYY/MM/DD HH:mm:ss'
							) +
							' - ' +
							options.level.toUpperCase() +
							` - ${workerName}` +
							(options.message ? options.message : '') +
							(options.meta && Object.keys(options.meta).length
								? '\n\t' +
									JSON.stringify(options.meta, undefined, 2)
								: '')
						);
					},
					json: false,
					colorize: true,
					prettyPrint: true,
					align: true,
					level: 'silly'
				}),
				new winston.transports.File({
					json: false,
					colorize: false,
					prettyPrint: true,
					align: true,
					name: 'all-file',
					filename: `${config.get(
						'server.logs.dir'
					)}/app-api-all.log`,
					level: 'debug'
				}),
				new winston.transports.File({
					json: false,
					colorize: false,
					prettyPrint: true,
					align: true,
					name: 'socket-file',
					filename: `${config.get(
						'server.logs.dir'
					)}/app-api-socket.log`,
					level: 'socket'
				}),
				new winston.transports.File({
					json: false,
					colorize: false,
					prettyPrint: true,
					align: true,
					name: 'error-file',
					filename: `${config.get(
						'server.logs.dir'
					)}/app-api-error.log`,
					level: 'error',
					handleExceptions: true,
					humanReadableUnhandledException: true
				})
			]
		});
		// Add custom colours
		winston.addColors(this.getCustomLogLevels().colors);
		this.winston.debug('Logger: Initiated successfully');
	}

	private getCustomLogLevels() {
		return {
			levels: {
				socket: 0,
				error: 1,
				warn: 2,
				info: 3,
				verbose: 4,
				debug: 5,
				silly: 6
			},
			colors: {
				error: 'red',
				warn: 'orange',
				socket: 'blue',
				info: 'yellow',
				verbose: 'white',
				debug: 'green',
				silly: 'purple'
			}
		};
	}
}
