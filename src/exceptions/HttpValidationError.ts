/**
 * @swagger
 * definitions:
 *   HttpValidationError:
 *     type: object
 *     properties:
 *       property:
 *         type: string
 *       messages:
 *         type: array
 *         items:
 *           type: string
 */
export default class HttpValidationError {
	constructor(property?: string, messages?: string[]) {
		if (property) {
			this.$property = property;
		}
		if (messages) {
			this.$messages = messages;
		}
	}
	private property: string;
	private messages: string[];

	public get $property(): string {
		return this.property;
	}

	public set $property(value: string) {
		this.property = value;
	}

	public get $messages(): string[] {
		return this.messages;
	}

	public set $messages(value: string[]) {
		this.messages = value;
	}
}
