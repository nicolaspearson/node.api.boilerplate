import * as config from 'config';
import * as jwt from 'jsonwebtoken';

/**
 * @swagger
 * definitions:
 *   TokenResponse:
 *     type: object
 *     properties:
 *       token:
 *         type: string
 */
export default class Token {
	constructor(token?: string) {
		if (token) {
			this.token = token;
		}
	}
	public token: string;

	public generateToken(id: number) {
		this.token = jwt.sign(
			{ id },
			config.get('server.auth.jwtSecret'),
			this.getTokenSigningOptions()
		);
	}

	private getTokenSigningOptions(): jwt.SignOptions {
		return { expiresIn: config.get('server.auth.jwtExpiresIn') };
	}

	public verifyToken() {
		return jwt.verify(this.token, config.get('server.auth.jwtSecret'));
	}
}
