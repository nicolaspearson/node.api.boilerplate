import 'reflect-metadata';
import 'source-map-support/register';
import 'ts-helpers';

import { Server as HttpServer } from 'http';
import * as Koa from 'koa';
import { Server as NetServer } from 'net';
import 'reflect-metadata';
import 'source-map-support/register';
import 'ts-helpers';
import { Container, Inject, Service } from 'typedi';

import AppLogger from './AppLogger';
import { WebServer } from './WebServer';

@Service()
export class Application {
	@Inject() private appLogger: AppLogger;

	public static app: Koa;

	public static apiUrl: string;

	public static options: IApplicationOptions;

	public static server: HttpServer | NetServer;

	constructor() {
		// Empty constructor
	}

	public static getApp(): Koa {
		return Application.app;
	}

	public static getServer(): HttpServer | NetServer {
		return Application.server;
	}

	public async setupApplication(options: IApplicationOptions): Promise<void> {
		// Return if an the instance of the app and server are already configured
		if (Application.getApp() && Application.getServer()) {
			return;
		}

		Application.options = options;

		this.appLogger.winston.debug('Application: Configuration Started');

		const webServer: WebServer = Container.get(WebServer);
		await webServer.setupWebServer(options);

		return;
	}
}

export interface IApplicationOptions {
	// Enable / Disable Koa Logger
	useKoaLogger: boolean;
}
