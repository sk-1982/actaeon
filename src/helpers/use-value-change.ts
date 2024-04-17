import { EffectCallback, useEffect, useRef } from 'react';

export const useValueChange = (onChange: EffectCallback, vals: any[], deps: any[] = []) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const lastVals = vals.map(val => useRef(val));

	useEffect(() => { 
		const last = lastVals.map(r => r.current);
		lastVals.forEach((ref, i) => ref.current = vals[i]);

		if (last.every((r, i) => r === vals[i]))
			return;

		return onChange();
	}, [...vals, ...deps])
};
