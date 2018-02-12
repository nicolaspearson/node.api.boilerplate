export default class Guid {
	private static gen(count: number) {
		let out = '';
		for (let i = 0; i < count; i++) {
			// tslint:disable no-bitwise
			out += (((1 + Math.random()) * 0x10000) | 0)
				.toString(16)
				.substring(1);
			// tslint:enable no-bitwise
		}
		return out;
	}

	public static newGuid() {
		return [
			this.gen(2),
			this.gen(1),
			this.gen(1),
			this.gen(1),
			this.gen(3)
		].join('-');
	}
}
