export interface ISearchQueryBuilderOptions {
	where: string;

	andWhere?: string[];

	orWhere?: string[];

	limit?: number;
}
