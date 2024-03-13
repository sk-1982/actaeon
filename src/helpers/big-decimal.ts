type DecimalInput = BigDecimal | number | string;

export class BigDecimal {
	private val: bigint;
	private decimals: bigint;

	constructor(val: DecimalInput) {
		if (val instanceof BigDecimal) {
			this.val = val.val;
			this.decimals = val.decimals;
			return;
		}

		if (typeof val === 'number')
			val = val.toString();

		const decimalIndex = val.indexOf('.');
		val = val.replace('.', '');
		this.val = BigInt(val);

		if (decimalIndex === -1) {
			this.decimals = 0n;
		} else {
			this.decimals = BigInt(val.length - decimalIndex);
		}
	}

	private coerceDecimals(other: DecimalInput) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);

		if (a.decimals > b.decimals) {
			b.val *= 10n ** (a.decimals - b.decimals);
			b.decimals = a.decimals;
		} else if (a.decimals < b.decimals) {
			a.val *= 10n ** (b.decimals - a.decimals);
			a.decimals = b.decimals;
		}

		return [a, b];
	}

	add(other: DecimalInput) {
		const [a, b] = this.coerceDecimals(other);
		a.val += b.val;
		return a;
	}

	sub(other: DecimalInput) {
		const [a, b] = this.coerceDecimals(other);
		b.val -= a.val;
		return b;
	}

	mul(other: DecimalInput) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);
		a.val *= b.val;
		a.decimals += b.decimals;
		return a;
	}

	div(other: DecimalInput, minDecimals=0n) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);

		if ((b.decimals - a.decimals) < minDecimals) {
			const exp = minDecimals - (b.decimals - a.decimals);
			b.val *= 10n ** exp;
			b.decimals += exp;
		}

		b.val /= a.val;
		b.decimals -= a.decimals;
		if (b.decimals < 0) b.decimals = 0n;

		return b;
	}

	static stringVal(val: bigint, decimals: bigint) {
		const str = val.toString();
		const pos = -Number(decimals);
		return str.slice(0, pos) + '.' + str.slice(pos);
	}


	toFixed(places: number | bigint) {
		places = BigInt(places);

		if (places >= this.decimals)
			return BigDecimal.stringVal(this.val, this.decimals) + '0'.repeat(Number(places - this.decimals));

		return BigDecimal.stringVal(this.val / (10n ** (this.decimals - places)), places);
	}

	valueOf() {
		return +this.toString();
	}

	toString() {
		let val = this.val;
		let decimals = this.decimals;
		while (val && !(val % 10n)) {
			val /= 10n;
			--decimals;
		}
		return BigDecimal.stringVal(val, decimals);
	}
}
