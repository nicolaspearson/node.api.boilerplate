import SearchTerm from '../models/internal/SearchTerm';
import { ISearchQueryBuilderOptions } from '../models/options/ISearchQueryBuilderOptions';

export default abstract class BaseService {
	public getSearchFilter(
		limit: number,
		searchTerms: SearchTerm[]
	): ISearchQueryBuilderOptions {
		let whereClause = '';
		const andWhereClause: string[] = [];
		for (const searchTerm of searchTerms) {
			const term = SearchTerm.newSearchTerm(searchTerm);
			const value = `'${term.value}'`;
			if (!whereClause || whereClause === '') {
				whereClause = `${term.field} ${term.operator ? term.operator : ' = '} ${
					value
				}`;
			} else {
				andWhereClause.push(
					`${term.field} ${term.operator ? term.operator : ' = '} ${value}`
				);
			}
		}
		return {
			where: whereClause,
			andWhere: andWhereClause,
			limit
		};
	}
}
