import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { NotFoundError } from '../exceptions';

export default class SwaggerService {
	constructor() {
		// Empty constructor
	}

	public async getApiDocsJson(): Promise<string> {
		const readFileAsync = promisify(fs.readFile);
		try {
			const filePath: string = path.resolve('dist/api-docs.json');
			return await readFileAsync(filePath, { encoding: 'utf8' });
		} catch (error) {
			throw new NotFoundError(
				'Unable to find the API Docs Swagger definition file: ' + error
			);
		}
	}
}
