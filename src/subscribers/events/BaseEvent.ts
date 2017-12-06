import { Container } from 'typedi';

import AppLogger from '../../app/AppLogger';
import { Sockets } from '../../app/Socket';

export class BaseEvent {
	public appLogger: AppLogger;

	public socketServer: SocketIO.Server;

	constructor() {
		this.appLogger = Container.get(AppLogger);
		this.socketServer = Sockets.getSocketServer();
	}
}
