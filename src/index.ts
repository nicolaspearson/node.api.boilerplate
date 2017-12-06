import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer } from 'typeorm';

import { Application, IApplicationOptions } from './app/Application';

/* tslint:disable no-console */
process.on('unhandledRejection', (reason, promise) => {
	console.error(reason, 'Unhandled Rejection at Promise', promise);
	process.exitCode = 1;
});
process.on('uncaughtException', error => {
	console.error(error, 'Uncaught Exception thrown');
	process.exitCode = 1;
});

async function createApp() {
	try {
		console.log('Creating app for a new worker');
		if (!Application.getApp() || !Application.getServer()) {
			routingUseContainer(Container);
			ormUseContainer(Container);
			const application: Application = Container.get(Application);
			await application.setupApplication({
				useKoaLogger: true
			} as IApplicationOptions);
		}
	} catch (error) {
		console.error(error, 'An error occurred starting the application');
		process.exitCode = 1;
	}
}

createApp();
