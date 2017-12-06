import {
	FindManyOptions,
	FindOneOptions,
	getManager,
	QueryFailedError,
	RemoveOptions,
	SaveOptions,
	SelectQueryBuilder
} from 'typeorm';

import {
	BadRequestError,
	HttpError,
	InternalServerError,
	NotFoundError
} from '../exceptions';
import { ISearchQueryBuilderOptions } from '../models/options/ISearchQueryBuilderOptions';

export default abstract class BaseRepository<T> {
	private entityName: string;

	constructor(entityName: string) {
		this.entityName = entityName;
	}

	protected getRepository() {
		return getManager().getRepository(this.entityName);
	}

	protected getQueryBuilder(): SelectQueryBuilder<T> {
		return getManager()
			.getRepository<T>(this.entityName)
			.createQueryBuilder(this.entityName);
	}

	/**
	 * This function wraps the execution of all repository calls
	 * in a generic try-catch in order to decrease duplication,
	 * and centralize error handling. All calls to the repository
	 * should be wrapped in this function
	 *
	 * @param repositoryFunction Promise<any>: The repository function that should be executed
	 */
	public async executeRepositoryFunction(
		repositoryFunction: Promise<any>
	): Promise<any> {
		try {
			return await repositoryFunction;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			if (error instanceof QueryFailedError) {
				throw new InternalServerError(error.message);
			}
			throw new BadRequestError(error);
		}
	}

	public async getAll(options?: FindManyOptions<T>): Promise<T[]> {
		return await this.executeRepositoryFunction(
			this.getRepository().find(options)
		);
	}

	public async findManyByFilter(options: FindManyOptions<T>): Promise<T[]> {
		const records = await this.executeRepositoryFunction(
			this.getRepository().find(options)
		);
		if (!records) {
			throw new NotFoundError(`The requested record was not found`);
		}
		return records;
	}

	public async findOneById(
		id: number,
		options?: FindOneOptions<T>
	): Promise<T> {
		const record = await this.executeRepositoryFunction(
			this.getRepository().findOneById(id, options)
		);
		if (!record) {
			throw new NotFoundError(`The requested record was not found: ${id}`);
		}
		return record;
	}

	public async findOneByFilter(options: FindOneOptions<T>): Promise<T> {
		const record = await this.executeRepositoryFunction(
			this.getRepository().findOne(options)
		);
		if (!record) {
			throw new NotFoundError(`The requested record was not found`);
		}
		return record;
	}

	public async save(record: T, options?: SaveOptions): Promise<T> {
		return await this.executeRepositoryFunction(
			this.getRepository().save(record, options)
		);
	}

	public async updateOneById(
		id: number,
		record: T,
		options?: SaveOptions
	): Promise<T> {
		const foundRecord = await this.findOneById(id);
		if (!foundRecord) {
			throw new NotFoundError(`The requested record was not found: ${id}`);
		}
		await this.executeRepositoryFunction(
			this.getRepository().updateById(id, record, options)
		);
		return record;
	}

	public async delete(record: T, options?: RemoveOptions) {
		return await this.executeRepositoryFunction(
			this.getRepository().remove(record, options)
		);
	}

	public async deleteOneWithId(
		id: number,
		findOptions?: FindOneOptions<T>,
		deleteOptions?: RemoveOptions
	): Promise<T> {
		const record = await this.findOneById(id, findOptions);
		if (!record) {
			throw new NotFoundError(`The requested record was not found: ${id}`);
		}
		return await this.delete(record, deleteOptions);
	}

	public async deleteManyWithId(
		idList: number[],
		deleteOptions?: RemoveOptions
	): Promise<T> {
		return await this.executeRepositoryFunction(
			this.getRepository().removeByIds(idList, deleteOptions)
		);
	}

	public async findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T | undefined> {
		const queryBuilder: SelectQueryBuilder<T> = this.getQueryBuilder();
		queryBuilder.where(options.where);
		if (options.andWhere) {
			for (const and of options.andWhere) {
				queryBuilder.andWhere(and);
			}
		}
		if (options.orWhere) {
			for (const or of options.orWhere) {
				queryBuilder.orWhere(or);
			}
		}
		queryBuilder.limit(1);
		return await queryBuilder.getOne();
	}

	public async findManyWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<T[]> {
		const queryBuilder: SelectQueryBuilder<T> = this.getQueryBuilder();
		queryBuilder.where(options.where);
		if (options.andWhere) {
			for (const and of options.andWhere) {
				queryBuilder.andWhere(and);
			}
		}
		if (options.orWhere) {
			for (const or of options.orWhere) {
				queryBuilder.orWhere(or);
			}
		}
		if (options.limit && options.limit > 0) {
			queryBuilder.limit(options.limit);
		}
		return await queryBuilder.getMany();
	}
}
