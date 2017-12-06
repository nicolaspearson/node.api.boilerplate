import User from '../models/User';
import BaseRepository from './BaseRepository';

export default class UserRepository extends BaseRepository<User> {
	constructor() {
		super(User.name);
	}
}
