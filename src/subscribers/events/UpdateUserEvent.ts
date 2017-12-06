import * as moment from 'moment';
import { Inject, Service } from 'typedi';

import User from '../../models/User';
import UserService from '../../services/UserService';
import { ISocketEvent } from '../interfaces/ISocketEvent';
import { EventAction } from '../models/EventAction';
import { BaseEvent } from './BaseEvent';

@Service()
export class UpdateUserEvent extends BaseEvent implements ISocketEvent {
	@Inject() private userService: UserService;

	constructor() {
		super();
	}

	public async handleAction(action: EventAction, clientId: string) {
		this.appLogger.winston.log(
			'socket',
			`${UpdateUserEvent.name}: Update User: ${JSON.stringify(action)}`
		);
		if (action.data && action.data.user && action.data.userId) {
			// Define the timestamp
			const updateTimestamp =
				action.data.date ||
				moment(new Date().toISOString()).format('YYYY/MM/DD HH:mm:ss');
			this.appLogger.winston.log(
				'socket',
				`${UpdateUserEvent.name}: Update Timestamp: ${updateTimestamp}`
			);

			try {
				// Get the user
				const user: User = await this.userService.findOneById(
					action.data.userId
				);

				if (action.data.user.emailAddress) {
					user.emailAddress = action.data.user.emailAddress;
				}

				if (action.data.user.emailAddress) {
					user.emailAddress = action.data.user.emailAddress;
				}

				// Update the User
				const userResult = await this.userService.update(user);
				this.appLogger.winston.log(
					'socket',
					`${UpdateUserEvent.name}: User Updated: ${JSON.stringify(userResult)}`
				);

				// Inform the client that the user has been updated
				this.socketServer.to(clientId).emit('action', {
					type: 'user_update_success',
					data: userResult
				});
				return;
			} catch (error) {
				this.appLogger.winston.log(
					'socket',
					`${UpdateUserEvent.name}: Error Updating User: ${error}`
				);
			}
		}
		// Inform the client the user has not been updated
		this.socketServer.to(clientId).emit('action', {
			type: '/response/user_update_error',
			data: action && action.data && action.data.user ? action.data.user : {}
		});
	}
}
