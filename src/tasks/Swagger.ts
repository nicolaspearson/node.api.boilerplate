import * as config from 'config';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import swaggerJSDoc = require('swagger-jsdoc');

const apiHost = config.get('server.api.host');
const apiBasePath = config.get('server.api.basePath');
const apiDocsPath = config.get('server.api.docs');

const activeControllers: string[] = [];
const activeModels: string[] = [];

const controllers = glob.sync(path.resolve('src/controllers/*.ts'));
const models = glob.sync(path.resolve('src/models/**/*.ts'));

activeControllers.push(...controllers);

activeModels.push(...models);

const errors = glob.sync(path.resolve('src/exceptions/*.ts'));

const options = {
	swaggerDefinition: {
		info: {
			title: 'Node API Boilerplate',
			version: '1.0.0'
		},
		host: apiHost,
		basePath: apiBasePath,
		schemes: ['http', 'https'],
		consumes: ['application/json'],
		produces: ['application/json']
	},
	apis: [...activeModels, ...errors, ...activeControllers]
};

const spec = swaggerJSDoc(options);

fs.writeFile(
	path.resolve(`dist/${apiDocsPath}.json`),
	JSON.stringify(spec, undefined, 2),
	error => {
		if (error) {
			// tslint:disable no-console
			console.log(error);
		}
	}
);
