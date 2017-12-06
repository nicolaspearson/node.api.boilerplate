/**
 * @swagger
 * definitions:
 *   SearchTermRequest:
 *     type: object
 *     properties:
 *       field:
 *         description: the field to be search on
 *         type: string
 *       value:
 *         description: the value to be compared
 *         type: string
 *       operator:
 *         description: the search operator to use
 *         type: string
 */
export default class SearchTerm {
	public field: string;

	public value: string;

	public operator: string;

	public static newSearchTerm(obj: {
		field?: string;
		value?: string;
		operator?: string;
	}) {
		const newSearchTerm = new SearchTerm();
		if (obj.field) {
			newSearchTerm.field = obj.field;
		}

		if (obj.value) {
			newSearchTerm.value = obj.value;
		}

		if (obj.operator) {
			newSearchTerm.operator = obj.operator;
		}
		return newSearchTerm;
	}
}
