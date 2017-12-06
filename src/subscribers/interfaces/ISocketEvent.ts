import { EventAction } from '../models/EventAction';

export interface ISocketEvent {
	handleAction(action: EventAction, clientId: string): void;
}
