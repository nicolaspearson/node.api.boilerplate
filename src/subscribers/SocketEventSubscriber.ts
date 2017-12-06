import { deserialize } from 'class-transformer';
import { EventSubscriber, On } from 'event-dispatch';
import { Container } from 'typedi';

import AppLogger from '../app/AppLogger';
import { UpdateUserEvent } from './events/UpdateUserEvent';
import { EventAction } from './models/EventAction';
import { EventData } from './models/EventData';

@EventSubscriber()
export class SocketEventSubscriber {
	private appLogger: AppLogger;

	private updateUserEvent: UpdateUserEvent;

	constructor() {
		this.appLogger = Container.get(AppLogger);
		this.updateUserEvent = Container.get(UpdateUserEvent);
	}

	@On('started')
	public onSocketServerStarted(data: any) {
		this.appLogger.winston.log('socket', `Socket Client ID: ${data.socket.id}`);
		this.appLogger.winston.log('socket', data.message);
	}

	@On('action')
	public onSocketServerAction(action: { type: string; data: any }) {
		if (!action || !action.type || !action.data) {
			this.appLogger.winston.error(`Error: Unable to process action`, action);
		}
		try {
			const eventData: EventData = deserialize(
				EventData,
				JSON.stringify(action.data),
				{
					enableCircularCheck: true
				}
			);
			const eventAction: EventAction = new EventAction();
			eventAction.data = eventData;
			eventAction.type = action.type;
			const clientId = action.data.socket.id;
			this.appLogger.winston.log(
				'socket',
				`Action Received: ${JSON.stringify(eventAction)}`
			);
			this.appLogger.winston.log('socket', `Socket Client ID: ${clientId}`);
			switch (eventAction.type) {
				case 'server/update_user':
					this.updateUserEvent.handleAction(eventAction, clientId);
					break;
				default:
					break;
			}
		} catch (error) {
			this.appLogger.winston.error(`Error: Unable to process action`, error);
		}
	}
}
