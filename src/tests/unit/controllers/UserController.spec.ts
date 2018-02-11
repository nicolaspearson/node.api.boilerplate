import { expect } from 'chai';
import * as config from 'config';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import UserController from '../../../controllers/UserController';
import { NotFoundError } from '../../../exceptions';
import Token from '../../../models/internal/Token';
import User from '../../../models/User';
import UserService from '../../../services/UserService';
import UserTestBuilder from '../../test-utils/UserTestBuilder';

// Allow console output in test classes
/* tslint:disable no-console */
describe('UserController', () => {
	let controllerUnderTest: UserController;
	let userService: UserService;

	const accessToken: string = config.get('server.auth.accessToken');

	const loginUsername = 'Tester';
	const loginPassword = 'hello123';

	const testId = 80085;

	const userWithId: User = UserTestBuilder.newUser()
		.withDefaultValues()
		.withId(testId)
		.build();

	const userWithoutId: User = UserTestBuilder.newUser()
		.withDefaultValues()
		.build();

	beforeEach(() => {
		userService = mock(UserService);
		controllerUnderTest = new UserController(instance(userService));
	});

	describe('postLogin, expect 200', () => {
		it('performs a user login', async () => {
			const user: User = new User();
			user.username = loginUsername;
			user.password = loginPassword;
			when(userService.login(loginUsername, loginPassword)).thenReturn(
				Promise.resolve({ user, token: new Token('someToken') })
			);

			const response: any = await controllerUnderTest.loginUser(
				accessToken,
				loginUsername,
				'',
				loginPassword
			);
			const token: Token = response.token;

			expect(token).to.have.property('token');
		});
	});

	describe('findUserById, expect 200', () => {
		it('fetches a user by id', async () => {
			when(userService.findOneById(testId)).thenReturn(
				Promise.resolve(userWithId)
			);

			const fetchedUser: User = await controllerUnderTest.findUserById(
				testId
			);

			verify(userService.findOneById(testId)).called();
			expect(fetchedUser).to.equal(userWithId);
		});

		it('return a 404 if no user is found', async () => {
			const errorMessage = new NotFoundError('No user found with ID.');
			when(userService.findOneById(testId)).thenThrow(errorMessage);
			try {
				await controllerUnderTest.findUserById(testId);
			} catch (error) {
				expect(error).to.equal(errorMessage);
			}
		});
	});

	describe('saveUser', () => {
		it('save a user, expect 200', async () => {
			const requestBody = {
				username: userWithoutId.username,
				emailAddress: userWithoutId.emailAddress
			};
			const requestUser: User = User.newUser(requestBody);

			when(userService.save(anything())).thenReturn(
				Promise.resolve(userWithId)
			);

			await controllerUnderTest.saveUser(accessToken, requestUser);

			const [firstArg] = capture(userService.save).last();
			console.log(`	Result: ${JSON.stringify(firstArg)}`);
			expect(firstArg.id).equals(undefined);
			expect(firstArg.username).equals(requestBody.username);
			expect(firstArg.emailAddress).equals(requestBody.emailAddress);
			expect(firstArg).to.equal(requestUser);
		});
	});

	describe('updateUser', () => {
		it('update a user, expect 200', async () => {
			const newEmailAddress = 'testee@test.com';
			const requestBody = {
				id: userWithId.id,
				username: userWithId.username,
				emailAddress: newEmailAddress
			};
			const requestUser: User = User.newUser(requestBody);

			when(userService.update(anything())).thenReturn(
				Promise.resolve(userWithId)
			);

			await controllerUnderTest.updateUser(testId, requestUser);

			const [firstArg] = capture(userService.update).last();
			console.log(`	Result: ${JSON.stringify(firstArg)}`);
			expect(firstArg.id).equals(testId);
			expect(firstArg.username).equals(requestBody.username);
			expect(firstArg.emailAddress).equals(requestBody.emailAddress);
			expect(firstArg).to.equal(requestUser);
		});
	});

	describe('deleteUser', () => {
		it('delete a user, expect 200', async () => {
			const requestBody = {
				id: userWithId.id,
				username: userWithId.username,
				emailAddress: userWithId.emailAddress,
				password: userWithId.password
			};
			const requestUser: User = User.newUser(requestBody);

			when(userService.delete(testId)).thenReturn(
				Promise.resolve(userWithId)
			);

			await controllerUnderTest.deleteUser(testId);

			const [id] = capture(userService.delete).last();
			console.log(`	Result: ${JSON.stringify(id)}`);
			expect(id).equals(testId);
			expect(userWithId.id).equals(requestUser.id);
			expect(userWithId.username).equals(requestUser.username);
			expect(userWithId.emailAddress).equals(requestUser.emailAddress);
			expect(userWithId.password).equals(requestUser.password);
		});
	});
});
