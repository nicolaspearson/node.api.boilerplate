import { Inject } from 'typedi';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import {
	BadRequestError,
	HttpError,
	InternalServerError,
	NotFoundError
} from '../../exceptions';
import SearchTerm from '../../models/internal/SearchTerm';
import { ISearchQueryBuilderOptions } from '../../models/options/ISearchQueryBuilderOptions';
import BaseService from '../../services/BaseService';
import Template from '../models/Template';
import TemplateRepository from '../repositories/TemplateRepository';

export default class TemplateService extends BaseService {
	@Inject() private templateRepository: TemplateRepository;

	constructor(templateRepository: TemplateRepository) {
		super();
		// Override the injected repository
		if (templateRepository) {
			this.templateRepository = templateRepository;
		}
	}

	public async findAll(): Promise<Template[]> {
		try {
			const templates: Template[] = await this.templateRepository.getAll();
			const sanitizedTemplates = templates.map((template: Template) => {
				template.sanitize();
				return template;
			});
			return sanitizedTemplates;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findAllByFilter(
		filter: FindManyOptions<Template>
	): Promise<Template[]> {
		try {
			const templates: Template[] = await this.templateRepository.findManyByFilter(
				filter
			);
			const sanitizedTemplates = templates.map((template: Template) => {
				template.sanitize();
				return template;
			});
			return sanitizedTemplates;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneById(id: number): Promise<Template> {
		try {
			if (!Template.validId(id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			const templateResult = await this.templateRepository.findOneById(
				id
			);
			return templateResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneByFilter(
		filter: FindOneOptions<Template>
	): Promise<Template> {
		try {
			const templateResult: Template = await this.templateRepository.findOneByFilter(
				filter
			);
			return templateResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findOneWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<Template> {
		try {
			const templateResult = await this.templateRepository.findOneWithQueryBuilder(
				options
			);
			if (templateResult) {
				return templateResult.sanitize();
			} else {
				throw new NotFoundError(
					'The requested object could not be found'
				);
			}
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async findManyWithQueryBuilder(
		options: ISearchQueryBuilderOptions
	): Promise<Template[]> {
		try {
			const results = await this.templateRepository.findManyWithQueryBuilder(
				options
			);
			const sanitizedResults = results.map((template: Template) => {
				template.sanitize();
				return template;
			});
			return sanitizedResults;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async search(limit: number, searchTerms: SearchTerm[]) {
		try {
			const filter = this.getSearchFilter(limit, searchTerms);
			return await this.findManyWithQueryBuilder(filter);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async save(template: Template): Promise<Template> {
		try {
			// Check if the template is valid
			const templateIsValid = await template.isValid();
			if (!templateIsValid) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Save the template to the database
			const templateResult = await this.templateRepository.save(template);
			return templateResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async update(template: Template): Promise<Template> {
		try {
			// Check if the template is valid
			const templateIsValid = await template.isValid();
			if (!templateIsValid || !Template.validId(template.id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			// Update the template on the database
			const templateResult = await this.templateRepository.updateOneById(
				template.id,
				template
			);
			return templateResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async delete(id: number): Promise<Template> {
		try {
			if (!Template.validId(id)) {
				throw new BadRequestError(
					'Incorrect / invalid parameters supplied'
				);
			}
			const templateResult = await this.templateRepository.deleteOneWithId(
				id
			);
			return templateResult.sanitize();
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}

	public async deleteByFilter(
		limit: number,
		searchTerms: SearchTerm[]
	): Promise<Template[]> {
		try {
			const filter = this.getSearchFilter(limit, searchTerms);
			const deleteTemplateList: Template[] = await this.findManyWithQueryBuilder(
				filter
			);
			if (deleteTemplateList.length < 1) {
				throw new NotFoundError(
					'No records matching the specified criteria were found'
				);
			}
			const idList: number[] = [];
			const sanitizedTemplateList = deleteTemplateList.map(
				(template: Template) => {
					template.sanitize();
					idList.push(template.id);
					return template;
				}
			);
			this.templateRepository.deleteManyWithId(idList);
			return sanitizedTemplateList;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new InternalServerError(error);
		}
	}
}
