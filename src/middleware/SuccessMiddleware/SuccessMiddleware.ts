import { KoaMiddlewareInterface, Middleware } from 'routing-controllers';

@Middleware({ type: 'before' })
export class SuccessMiddleware implements KoaMiddlewareInterface {
	public async use(
		ctx: any,
		next: (error?: any) => Promise<any>
	): Promise<any> {
		try {
			await next();
			// Wrap a successful response in data
			if (ctx && ctx.status === 200 && ctx.body) {
				const dataResponse = { data: ctx.body };
				ctx.set('content-type', 'application/json');
				ctx.body = dataResponse;
			}
		} catch (error) {
			throw error;
		}
	}
}
