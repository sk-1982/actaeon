type DecimalInput = BigDecimal | number | string;

export class BigDecimal {
	private _val: bigint;
	private _decimals: bigint;

	static readonly ZERO = new BigDecimal(0);
	static readonly ONE = new BigDecimal(1);

	constructor(val: DecimalInput) {
		if (val instanceof BigDecimal) {
			this._val = val._val;
			this._decimals = val._decimals;
			return;
		}

		if (typeof val === 'number')
			val = val.toString();

		const decimalIndex = val.indexOf('.');
		val = val.replace('.', '');
		this._val = BigInt(val);

		if (decimalIndex === -1) {
			this._decimals = 0n;
		} else {
			this._decimals = BigInt(val.length - decimalIndex);
		}
	}

	private coerceDecimals(other: DecimalInput) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);

		if (a._decimals > b._decimals) {
			b._val *= 10n ** (a._decimals - b._decimals);
			b._decimals = a._decimals;
		} else if (a._decimals < b._decimals) {
			a._val *= 10n ** (b._decimals - a._decimals);
			a._decimals = b._decimals;
		}

		return [a, b];
	}

	add(other: DecimalInput) {
		const [a, b] = this.coerceDecimals(other);
		a._val += b._val;
		return a;
	}

	sub(other: DecimalInput) {
		const [a, b] = this.coerceDecimals(other);
		b._val -= a._val;
		return b;
	}

	mul(other: DecimalInput) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);
		a._val *= b._val;
		a._decimals += b._decimals;
		return a;
	}

	div(other: DecimalInput, minDecimals=0n) {
		const a = new BigDecimal(other);
		const b = new BigDecimal(this);

		if ((b._decimals - a._decimals) < minDecimals) {
			const exp = minDecimals - (b._decimals - a._decimals);
			b._val *= 10n ** exp;
			b._decimals += exp;
		}

		b._val /= a._val;
		b._decimals -= a._decimals;
		if (b._decimals < 0) b._decimals = 0n;

		return b;
	}

	static stringVal(val: bigint, decimals: bigint) {
		if (decimals === 0n || val === 0n) return val.toString();
		const str = val.toString().padStart(Number(decimals), '0');
		const pos = -Number(decimals);
		return (str.slice(0, pos) || '0') + '.' + str.slice(pos);
	}

	compare(other: DecimalInput) {
		const [b, a] = this.coerceDecimals(other);
		if (a._val === b._val) return 0;
		if (a._val > b._val) return 1;
		return -1;
	}

	toFixed(places: number | bigint) {
		places = BigInt(places);

		if (places >= this._decimals)
			return BigDecimal.stringVal(this._val, this._decimals) + '0'.repeat(Number(places - this._decimals));

		return BigDecimal.stringVal(this._val / (10n ** (this._decimals - places)), places);
	}

	get val() {
		return this._val;
	}

	get decimals() {
		return this._decimals;
	}

	valueOf() {
		return +this.toString();
	}

	toString() {
		let val = this._val;
		let decimals = this._decimals;
		while (val && !(val % 10n) && decimals) {
			val /= 10n;
			--decimals;
		}
		return BigDecimal.stringVal(val, decimals);
	}
}
