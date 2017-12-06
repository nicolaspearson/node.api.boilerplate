import * as Koa from 'koa';
import { Inject } from 'typedi';
import * as winston from 'winston';
import * as KoaLoggerWinston from '../middleware/KoaLoggerWinston/index';
import AppLogger from './AppLogger';

export class Logging {
	@Inject() private appLogger: AppLogger;

	constructor() {
		// Empty constructor
	}

	public setupLogging(app: Koa, workerName: string) {
		// Initialize the Koa Logger Middleware
		const koaLoggerWinston: KoaLoggerWinston.Logger = new KoaLoggerWinston.Logger(
			this.getKoaLoggerOptions(this.appLogger.winston)
		);
		// Add the Koa Logger Middleware
		app.use(koaLoggerWinston.log());
		this.appLogger.winston.debug(`Logger: ${workerName}: Middleware Added`);
	}

	private getKoaLoggerOptions(
		logger: winston.LoggerInstance
	): KoaLoggerWinston.Options {
		return {
			winstonInstance: logger,
			level: 'info',
			colorize: true,
			reqKeys: [
				'headers',
				'url',
				'method',
				'httpVersion',
				'href',
				'query',
				'length',
				'body'
			],
			reqSelect: [],
			reqUnselect: ['headers.cookie'],
			resKeys: ['headers', 'status', 'body'],
			resSelect: [],
			resUnselect: []
		};
	}
}
