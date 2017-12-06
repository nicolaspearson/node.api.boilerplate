import { Middleware } from 'koa';
import { Options } from '../../middleware/KoaLoggerWinston/models/Options';

export = Logger;

declare class Logger {
	constructor();
	log(): Middleware;
}
