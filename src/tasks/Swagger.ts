import * as config from 'config';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import swaggerJSDoc = require('swagger-jsdoc');

const controllers = glob.sync(path.resolve('src/controllers/*.ts'));
const errors = glob.sync(path.resolve('src/exceptions/*.ts'));
const models = glob.sync(path.resolve('src/models/**/*.ts'));

const apiHost = config.get('server.api.host');
const apiBasePath = config.get('server.api.basePath');
const apiDocsPath = config.get('server.api.docs');

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
	apis: [...models, ...errors, ...controllers]
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
