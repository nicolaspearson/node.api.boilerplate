import BaseRepository from '../../repositories/BaseRepository';
import Template from '../models/Template';

export default class TemplateRepository extends BaseRepository<Template> {
	constructor() {
		super(Template.name);
	}
}
