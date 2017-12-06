import * as chalk from 'chalk';
import * as Koa from 'koa';
import { get, set, template, unset } from 'lodash';
import * as winston from 'winston';
import { Options } from '../models/Options';
import { Payload } from '../models/Payload';

export class Logger {
	private options: Options;

	constructor(options: Options) {
		this.options = options;
	}

	private clone = (obj: any) => {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}
		const cloned: any = {};
		Object.keys(obj).forEach(key => {
			cloned[key] = this.clone(obj[key]);
		});
		return cloned;
	};

	private serializePayload(payload: Payload) {
		const { defaults = [], selects = [], unselects = [] } = payload;

		const finalSelects = defaults.concat(selects);
		return (target: any) => {
			if (!target) {
				return {};
			}

			let logObject = {};
			finalSelects.forEach(path => {
				set(logObject, path, get(target, path));
			});
			if (unselects.length) {
				logObject = this.clone(logObject);
				unselects.forEach(path => {
					unset(logObject, path);
				});
			}

			return logObject;
		};
	}

	private serializeRequest(options: Options) {
		const payload = new Payload();
		payload.defaults = options.reqKeys;
		payload.selects = options.reqSelect;
		payload.unselects = options.reqUnselect;
		return this.serializePayload(payload);
	}

	private serializeResponse(options: Options) {
		const payload = new Payload();
		payload.defaults = options.resKeys;
		payload.selects = options.resSelect;
		payload.unselects = options.resUnselect;
		return this.serializePayload(payload);
	}

	private getLogLevel(statusCode: number, defaultLevel: string): string {
		let level = defaultLevel;
		if (statusCode >= 100) {
			level = 'info';
		}
		if (statusCode >= 400) {
			level = 'warn';
		}
		if (statusCode >= 500) {
			level = 'error';
		}
		return level;
	}

	public log() {
		this.options.level = this.options.level || 'info';
		this.options.winstonInstance =
			this.options.winstonInstance ||
			new winston.Logger({ transports: this.options.transports });
		this.options.colorize = this.options.colorize || false;
		this.options.reqKeys = this.options.reqKeys || [
			'headers',
			'url',
			'method',
			'httpVersion',
			'href',
			'query',
			'length'
		];
		this.options.reqSelect = this.options.reqSelect || [];
		this.options.reqUnselect = this.options.reqUnselect || ['headers.cookie'];
		this.options.resKeys = this.options.resKeys || ['headers', 'status'];
		this.options.resSelect = this.options.resSelect || [];
		this.options.resUnselect = this.options.resUnselect || [];

		const reqSerializer = this.serializeRequest(this.options);
		const resSerializer = this.serializeResponse(this.options);

		return async (ctx: Koa.Context, next: any) => {
			const meta: any = {
				req: reqSerializer(ctx.request)
			};
			const startedAt = Date.now();
			await next();
			meta.res = resSerializer(ctx.response);
			meta.res.duration = Date.now() - startedAt;

			let koaMsgFormat =
				'{{req.method}} {{req.url}} {{res.status}} {{res.duration}}ms';
			if (this.options.colorize) {
				let statusColor: chalk.ChalkChain = chalk.green;
				if (meta.res.statusCode >= 500) {
					statusColor = chalk.red;
				} else if (meta.res.statusCode >= 400) {
					statusColor = chalk.yellow;
				} else if (meta.res.statusCode >= 300) {
					statusColor = chalk.cyan;
				}

				koaMsgFormat =
					chalk.grey('{{req.method}} {{req.url}}') +
					statusColor(' {{res.status}} ') +
					chalk.grey('{{res.duration}}ms');
			}

			const koaTemplate = template(koaMsgFormat, {
				interpolate: /\{\{(.+?)\}\}/g
			});

			const msg = koaTemplate({
				req: meta.req,
				res: meta.res
			});

			const logLevel: string = this.getLogLevel(
				meta.res.status,
				this.options.level
			);
			if (this.options.winstonInstance) {
				this.options.winstonInstance.log(logLevel, msg, meta);
			}
		};
	}
}
