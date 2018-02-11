import { BadRequestError } from '../exceptions';
import SearchTerm from '../models/internal/SearchTerm';
import { ISearchQueryBuilderOptions } from '../models/options/ISearchQueryBuilderOptions';

export default abstract class BaseService {
	public getSearchFilter(
		limit: number,
		searchTerms: SearchTerm[]
	): ISearchQueryBuilderOptions {
		if (limit >= 0 && searchTerms && searchTerms.length > 0) {
			let whereClause = '';
			const andWhereClause: string[] = [];
			for (const searchTerm of searchTerms) {
				const term = SearchTerm.newSearchTerm(searchTerm);
				let quoteValue = true;
				if (
					searchTerm.value.startsWith('(') &&
					searchTerm.value.endsWith(')')
				) {
					quoteValue = false;
				}
				const value = quoteValue ? `'${term.value}'` : `${term.value}`;
				if (!whereClause || whereClause === '') {
					whereClause = `${term.field} ${
						term.operator ? term.operator : ' = '
					} ${value}`;
				} else {
					andWhereClause.push(
						`${term.field} ${
							term.operator ? term.operator : ' = '
						} ${value}`
					);
				}
			}
			return {
				where: whereClause,
				andWhere: andWhereClause,
				limit
			};
		} else {
			throw new BadRequestError(
				'Incorrect / invalid parameters supplied'
			);
		}
	}
}
