import { Type } from 'class-transformer';
import User from '../../models/User';

export class EventData {
	public userId?: number;

	@Type(() => User)
	public user?: User;

	public date?: string;
}
