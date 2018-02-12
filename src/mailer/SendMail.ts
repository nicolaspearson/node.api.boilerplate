import * as config from 'config';
import * as nodemailer from 'nodemailer';
import * as sendMailTransport from 'nodemailer-sendmail-transport';
import { Inject } from 'typedi';

import AppLogger from '../app/AppLogger';

export default class SendMail {
	@Inject() private appLogger: AppLogger;

	private transport: nodemailer.Transporter;

	constructor() {
		this.createTransport();
	}

	private createTransport() {
		this.transport = nodemailer.createTransport(
			sendMailTransport({
				newline: 'unix',
				path: '/usr/sbin/sendmail'
			})
		);
	}

	public async send(
		subject: string,
		recipients: string[],
		content: string
	): Promise<nodemailer.SentMessageInfo> {
		this.appLogger.winston.debug(`SendMail: Sending...`);
		const from: string = `${config.get(
			'server.email.sender'
		)} <${config.get('server.email.from')}>`;
		return await this.transport.sendMail({
			from,
			to: recipients,
			subject,
			html: content
		});
	}
}
