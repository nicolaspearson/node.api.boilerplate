export function stringHash(value: string) {
	let hash: number = 5381;
	let i: number = value.length;

	// tslint:disable no-bitwise
	while (i) {
		hash = (hash * 33) ^ value.charCodeAt(--i);
	}

	/* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
	 * integers. Since we want the results to be always positive, convert the
	 * signed int to an unsigned by doing an unsigned bit shift. */
	return hash >>> 0;
}
