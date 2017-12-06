import User from '../../models/User';

export default class UserTestBuilder {
	private user: User;

	constructor() {
		this.user = new User();
	}

	public static newUser(): UserTestBuilder {
		return new UserTestBuilder();
	}

	public withId(id: number): UserTestBuilder {
		this.user.id = id;
		return this;
	}

	public withUsername(username: string): UserTestBuilder {
		this.user.username = username;
		return this;
	}

	public withEmailAddress(emailAddress: string): UserTestBuilder {
		this.user.emailAddress = emailAddress;
		return this;
	}

	public withPassword(password: string): UserTestBuilder {
		this.user.password = password;
		return this;
	}

	public withRandomId(): UserTestBuilder {
		this.user.id = Math.random() * 10;
		return this;
	}

	public withDefaultValues(): UserTestBuilder {
		return this.withId(1)
			.withUsername('Tester')
			.withEmailAddress('tester@test.com')
			.withPassword('hello123');
	}

	public build(): User {
		return this.user;
	}

	public static getListOfDefaultUsers(length: number): User[] {
		const result = [];
		for (let i = 0; i < length; i++) {
			result.push(
				UserTestBuilder.newUser()
					.withDefaultValues()
					.build()
			);
		}
		return result;
	}

	public static createListOfDefaultUsers(size: number) {
		const result = [];
		for (let i = 0; i < size; i++) {
			result.push(
				UserTestBuilder.newUser()
					.withDefaultValues()
					.withId(Math.random() * 10)
					.build()
			);
		}
		return result;
	}
}
