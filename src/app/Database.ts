import * as config from 'config';
import * as Koa from 'koa';
import * as path from 'path';
import { Inject } from 'typedi';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import AppLogger from './AppLogger';

export class Database {
	@Inject() private appLogger: AppLogger;

	private connection: Connection;

	constructor() {
		// Empty constructor
	}

	public async setupDatabase(app: Koa): Promise<Connection> {
		// Create the database connection
		try {
			if (!this.connection) {
				this.connection = await createConnection(this.getConnectionOptions());
			}
		} catch (error) {
			throw error;
		}
		this.appLogger.winston.debug(`Database: Connected`);
		return this.connection;
	}

	private getConnectionOptions(): ConnectionOptions {
		const options: ConnectionOptions = {
			database: String(config.get('server.db.database')),
			entities: [path.resolve('dist/models/*.js')],
			host: config.get('server.db.host'),
			logging: this.getDatabaseLogLevel(),
			name: config.get('server.db.name'),
			password: config.get('server.db.password'),
			port: config.get('server.db.port'),
			type: 'mysql',
			username: config.get('server.db.username')
		};
		return options;
	}

	// Get the desired log level from config, unfortunately the type is not exposed
	// therefore we need to compose an ugly type definition in the declaration
	private getDatabaseLogLevel() {
		let logLevel = false as
			| boolean
			| 'all'
			| Array<
					'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'
				>;
		if (config.get('server.db.logging')) {
			logLevel = config.get('server.db.logging');
		}
		return logLevel;
	}
}
