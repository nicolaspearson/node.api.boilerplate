import { KoaMiddlewareInterface, Middleware } from 'routing-controllers';
import * as Exceptions from '../../exceptions';

@Middleware({ type: 'before' })
export class ErrorMiddleware implements KoaMiddlewareInterface {
	public async use(
		ctx: any,
		next: (error?: any) => Promise<any>
	): Promise<any> {
		try {
			await next();
		} catch (error) {
			let httpError: Exceptions.HttpError = new Exceptions.InternalServerError(
				'An unknown internal server error occurred'
			);
			// Check if we have an embedded error object
			if (
				error &&
				error.response &&
				error.response.data &&
				error.response.data.status &&
				error.response.data.title &&
				error.response.data.detail
			) {
				error = new Exceptions.HttpError(
					error.response.data.status,
					error.response.data.title,
					error.response.data.detail
				);
			}
			if (
				error &&
				error.errors &&
				error.errors.length > 0 &&
				error.errors instanceof Array
			) {
				try {
					error = new Exceptions.BadRequestError(
						'Validation failed on the provided request',
						error.errors
					);
				} catch (error) {
					error = new Exceptions.BadRequestError(
						'Unable to validate request: ' + error
					);
				}
			}
			if (error) {
				if (error && error.detail && error.detail.stack) {
					error.detail = error.detail.stack;
				} else if (error && error.detail && error.detail.message) {
					error.detail = error.detail.message;
				}
				if (!(error instanceof Exceptions.HttpError)) {
					const statusCode = error.status || error.httpCode || 500;
					switch (statusCode) {
						case 400:
							httpError = new Exceptions.BadRequestError(
								error.message || error.detail || error
							);
							break;

						case 401:
							httpError = new Exceptions.UnauthorizedError(
								error.message || error.detail || error
							);
							break;

						case 403:
							httpError = new Exceptions.ForbiddenError(
								error.message || error.detail || error
							);
							break;

						case 404:
							httpError = new Exceptions.NotFoundError(
								error.message || error.detail || error
							);
							break;

						case 405:
							httpError = new Exceptions.MethodNotAllowedError(
								error.message || error.detail || error
							);
							break;

						case 406:
							httpError = new Exceptions.NotAcceptableError(
								error.message || error.detail || error
							);
							break;

						case 500:
							httpError = new Exceptions.InternalServerError(
								error.message || error.detail || error
							);
							break;

						case 504:
							httpError = new Exceptions.GatewayTimeoutError(
								error.message || error.detail || error
							);
							break;

						default:
							httpError = new Exceptions.HttpError(
								statusCode || 500,
								error.title || '500: Internal Server Error',
								error.message || error.detail || error
							);
							break;
					}
				} else {
					httpError = error;
				}
			}
			ctx.status = httpError.status;
			try {
				ctx.body = JSON.stringify(httpError);
			} catch (error) {
				ctx.body = httpError;
			}
			ctx.app.emit('error', httpError, ctx);
		}
	}
}
