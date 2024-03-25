import { CHUNI_DIFFICULTIES } from '@/helpers/chuni/difficulties';
import { SelectItem } from '@nextui-org/react';
import { FilterField } from '@/components/filter-sorter';
import { ChuniMusic } from '@/actions/chuni/music';
import { CHUNI_GENRES } from '@/helpers/chuni/genres';
import { CHUNI_LAMPS } from '@/helpers/chuni/lamps';
import { CHUNI_WORLDS_END_TAGS } from '@/helpers/chuni/worlds-end-tags';
import { CHUNI_SCORE_RANKS } from '@/helpers/chuni/score-ranks';
import { worldsEndStars } from '@/helpers/chuni/worlds-end-stars';

export const CHUNI_FILTER_DIFFICULTY: FilterField<ChuniMusic, 'select', 'difficulty'> = {
	type: 'select',
	name: 'difficulty',
	label: 'Difficulty',
	value: new Set<string>(),
	className: 'col-span-6 md:col-span-3 lg:col-span-2 5xl:col-span-1',
	props: {
		children: CHUNI_DIFFICULTIES.map((name, i) => <SelectItem key={i.toString()} value={i.toString()}>
		{name}
		</SelectItem>),
		selectionMode: 'multiple'
	},
	filter: (val: Set<string>, data) => !val.size || val.has(data.chartId?.toString()!)
};

export const CHUNI_FILTER_GENRE: FilterField<ChuniMusic, 'select', 'genre'> = {
	type: 'select',
	name: 'genre',
	label: 'Genre',
	value: new Set<string>(),
	className: 'col-span-6 md:col-span-3 lg:col-span-2 5xl:col-span-1',
	props: {
		children: CHUNI_GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>),
		selectionMode: 'multiple'
	},
	filter: (val: Set<string>, data) => !val.size || val.has(data.genre!)
};

export const CHUNI_FILTER_LAMP: FilterField<ChuniMusic, 'select', 'lamp'> = {
	type: 'select',
	name: 'lamp',
	label: 'Lamp',
	value: new Set<string>(),
	className: 'col-span-6 md:col-span-3 lg:col-span-2 5xl:col-span-1',
	props: {
		children: [
			<SelectItem key="aj" value="aj">All Justice</SelectItem>,
			<SelectItem key="fc" value="fc">Full Combo</SelectItem>,
			...[...CHUNI_LAMPS].map(([id, name]) => <SelectItem key={id.toString()} value={id.toString()}>{name}</SelectItem>)
		],
		selectionMode: 'multiple'
	},
	filter: (val: Set<string>, data) => {
		if (!val.size) return true;

		const checkLamps = [...CHUNI_LAMPS].some(([id]) => val.has(id.toString()));
		if (checkLamps && (!data.isSuccess || !val.has(data.isSuccess.toString())))
			return false

		if (val.has('aj') && val.has('fc') && !(data.isFullCombo || data.isAllJustice))
			return false
		else if (val.has('aj') && !val.has('fc') && !data.isAllJustice)
			return false;
		else if (val.has('fc') && !data.isFullCombo)
			return false;
		return true;
	}
};

export const CHUNI_FILTER_WORLDS_END_TAG: FilterField<ChuniMusic, 'select', 'worldsEndTag'> = {
	type: 'select',
	name: 'worldsEndTag',
	label: 'World\'s End Tag',
	value: new Set<string>(),
	className: 'col-span-6 md:col-span-3 lg:col-span-2 xl:col-span-2 5xl:col-span-1',
	props: {
		children: CHUNI_WORLDS_END_TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>),
		selectionMode: 'multiple'
	},
	filter: (val: Set<string>, data) => !val.size || !data.worldsEndTag || val.has(data.worldsEndTag)
};

export const CHUNI_FILTER_SCORE: FilterField<ChuniMusic, 'select', 'score'> = {
	type: 'select',
	name: 'score',
	label: 'Score',
	value: new Set<string>(),
	className: 'col-span-6 sm:col-span-6 md:col-span-3 lg:col-span-2 xl:col-span-2 2xl:col-span-3 5xl:col-span-1',
	props: {
		children: CHUNI_SCORE_RANKS
			.map((s, i) => <SelectItem key={i.toString()} value={i.toString()}>{s}</SelectItem>)
			.reverse(),
		selectionMode: 'multiple'
	},
	filter: (val: Set<string>, data) => !val.size || val.has(data.scoreRank?.toString()!)
};

export const CHUNI_FILTER_FAVORITE: FilterField<ChuniMusic, 'switch', 'favorite'> = {
	type: 'switch',
	name: 'favorite',
	label: 'Favorites',
	value: false,
	className: 'justify-self-end col-span-6 md:col-span-3 md:col-start-10 lg:col-span-2 lg:col-start-auto 2xl:col-span-1 5xl:col-start-12',
	filter: (val: boolean, data) => !val || data.favorite
};

export const CHUNI_FILTER_WORLDS_END_STARS: FilterField<ChuniMusic, 'slider', 'worldsEndStars'> = {
	type: 'slider',
	name: 'worldsEndStars',
	label: 'World\'s End Stars',
	value: [1, 5],
	className: 'col-span-full md:col-span-6 md:col-start-4 md:row-start-2 lg:row-start-auto lg:col-start-auto lg:col-span-4 5xl:col-span-2 5xl:row-start-1 5xl:col-start-6',
	filter: ([a, b]: number[], val) => {
		if (!val.worldsEndTag) return true;
		const stars = Math.ceil(val.level! / 2);
		return stars >= a && stars <= b;
	},
	props: {
		maxValue: 5,
		minValue: 1,
		showSteps: true,
		getValue: (v) => Array.isArray(v) ?
			`${worldsEndStars(v[0])}\u2013${worldsEndStars(v[1])}` : worldsEndStars(v),
		renderValue: ({ children, className, ...props }: any) => <span className="text-[0.65rem]" {...props}>{ children }</span>
	}
};

export const getLevelFromStop = (n: number) => {
	if (n < 7)
		return n + 1;
	return ((n - 6) * 0.1 + 7).toFixed(1);
};

export const getLevelValFromStop = (n: number) => {
	if (n < 7)
		return n + 1;
	return ((n - 6) * 0.1 + 7);
};

export const CHUNI_FILTER_LEVEL: FilterField<ChuniMusic, 'slider', 'level'> = {
	type: 'slider',
	name: 'level',
	label: 'Level',
	value: [0, 90],
	className: 'col-span-full md:col-span-6 lg:col-span-4 5xl:col-span-2 5xl:row-start-1 5xl:col-start-8',
	filter: ([a, b]: number[], val) => {
		if (val.worldsEndTag) return true;
		a = getLevelValFromStop(a);
		b = getLevelValFromStop(b);
		return val.level! + 0.05 > a && val.level! - 0.05 < b;
	},
	props: {
		maxValue: 90,
		minValue: 0,
		getValue: (v) => Array.isArray(v) ?
			`${getLevelFromStop(v[0])}\u2013${getLevelFromStop(v[1])}` : getLevelFromStop(v).toString()
	}
};

export const CHUNI_FILTER_RATING: FilterField<ChuniMusic, 'slider', 'rating'> = {
	type: 'slider',
	name: 'rating',
	label: 'Rating',
	value: [0, 17.55],
	className: 'col-span-full md:col-span-6 lg:col-span-4 5xl:col-span-2 5xl:row-start-1 5xl:col-start-10',
	filter: ([a, b]: number[], val) => {
		if (val.worldsEndTag) return true;
		return +val.rating >= a && +val.rating <= b;
	},
	props: {
		maxValue: 17.55,
		minValue: 0,
		step: 0.01
	}
};
