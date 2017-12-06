import { Type } from 'class-transformer';

import { EventData } from './EventData';

export class EventAction {
	public type: string;

	@Type(() => EventData)
	public data: EventData;
}
