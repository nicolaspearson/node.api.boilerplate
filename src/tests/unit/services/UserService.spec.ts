import { expect } from 'chai';
import { instance, mock, verify, when } from 'ts-mockito/lib/ts-mockito';
import UserRepository from '../../../repositories/UserRepository';
import UserService from '../../../services/UserService';
import UserTestBuilder from '../../test-utils/UserTestBuilder';

// Allow console output in test classes
/* tslint:disable no-console */
describe('UserService', () => {
	let serviceUnderTest: UserService;
	let userRepository: UserRepository;

	const testId = 80085;

	const testUserList = UserTestBuilder.getListOfDefaultUsers(5);

	const testUserWithId = UserTestBuilder.newUser()
		.withDefaultValues()
		.withId(testId)
		.build();

	const testUserWithoutId = UserTestBuilder.newUser()
		.withDefaultValues()
		.build();

	beforeEach(() => {
		userRepository = mock(UserRepository);
		serviceUnderTest = new UserService(instance(userRepository));
	});

	describe('findAll', () => {
		it('should return the 5 dummy users', async () => {
			when(userRepository.getAll()).thenReturn(Promise.resolve(testUserList));
			const actual = await serviceUnderTest.findAll();
			expect(actual).to.have.length(5);
		});
	});

	describe('findOneById', () => {
		it('should return the user with given id if the user exists', async () => {
			when(userRepository.findOneById(testId)).thenReturn(
				Promise.resolve(testUserWithId)
			);
			const actual = await serviceUnderTest.findOneById(testId);
			expect(actual).to.equal(testUserWithId);
		});
	});

	describe('saveUser', () => {
		it('should add a user with the given information', async () => {
			when(userRepository.save(testUserWithoutId)).thenReturn(
				Promise.resolve(testUserWithId)
			);
			const actual = await serviceUnderTest.save(testUserWithoutId);
			expect(actual).to.equal(testUserWithId);
		});
	});

	describe('updateUser', () => {
		it('should update a user with the given information', async () => {
			const user = testUserWithoutId;
			const newEmailAddress = 'testee@test.com';
			user.id = 80085;
			user.emailAddress = newEmailAddress;
			when(userRepository.updateOneById(user.id, user)).thenReturn(
				Promise.resolve(user)
			);
			const actual = await serviceUnderTest.update(user);
			console.log(`	Result: ${JSON.stringify(actual)}`);
			expect(user.id).equals(testUserWithId.id);
			expect(user.username).equals(testUserWithId.username);
			expect(user.emailAddress).equals(newEmailAddress);
		});
	});

	describe('deleteUser', () => {
		it('should delete the specified user', async () => {
			when(userRepository.deleteOneWithId(testId)).thenReturn(
				Promise.resolve(testUserWithId)
			);
			await serviceUnderTest.delete(testId);
			verify(userRepository.deleteOneWithId(testId)).called();
		});
	});
});
