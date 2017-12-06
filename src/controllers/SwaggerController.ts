import * as Koa from 'koa';
import { Authorized, Ctx, Get, JsonController } from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { HttpError } from '../exceptions';
import SwaggerService from '../services/SwaggerService';

@Service()
@JsonController()
export default class SwaggerController {
	@Inject() private swaggerService: SwaggerService;

	constructor() {
		// Empty constructor
	}

	@Get('/api-docs.json')
	@Authorized()
	// Serve the Swagger Docs
	public async getApiDocs(@Ctx() ctx: Koa.Context): Promise<Koa.Context> {
		try {
			const apiDocsJson = await this.swaggerService.getApiDocsJson();
			ctx.set('Cache-Control', 'no-cache');
			ctx.set('Content-Type', 'application/json');
			ctx.body = apiDocsJson;
		} catch (error) {
			if (error instanceof HttpError) {
				ctx.status = error.status || 500;
				ctx.body = error.toJson();
				ctx.app.emit('error', error, ctx);
			} else {
				ctx.status = 404;
				ctx.body = error.message;
				ctx.app.emit('error', error, ctx);
			}
		}
		return ctx;
	}
}
