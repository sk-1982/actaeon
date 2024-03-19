'use client';

import { CHUNI_FILTER_DIFFICULTY, CHUNI_FILTER_FAVORITE, CHUNI_FILTER_GENRE, CHUNI_FILTER_LAMP, CHUNI_FILTER_LEVEL, CHUNI_FILTER_RATING, CHUNI_FILTER_SCORE, CHUNI_FILTER_WORLDS_END_STARS, CHUNI_FILTER_WORLDS_END_TAG, getLevelValFromStop } from '@/helpers/chuni/filter';
import { FilterField, FilterSorter } from '@/components/filter-sorter';
import { SelectItem } from '@nextui-org/react';
import React, { useState } from 'react';
import { ChuniMusic } from '@/actions/chuni/music';
import { ArrayIndices } from 'type-fest';
import { ChuniPlaylog, getPlaylog } from '@/actions/chuni/playlog';
import { WindowScrollerGrid } from '@/components/window-scroller-grid';
import { ChuniPlaylogCard } from '@/components/chuni/playlog-card';
import { useBreakpoint } from '@/helpers/use-breakpoint';

const FILTERERS = ([
	CHUNI_FILTER_DIFFICULTY,
	CHUNI_FILTER_GENRE,
	{ ...CHUNI_FILTER_LAMP,
		props: {
			children: [
				<SelectItem key="aj" value="aj">All Justice</SelectItem>,
				<SelectItem key="fc" value="fc">Full Combo</SelectItem>,
				<SelectItem key="clear" value="clear">Clear</SelectItem>,
			],
			selectionMode: 'multiple'
		}
	},
	CHUNI_FILTER_WORLDS_END_TAG,
	{ ...CHUNI_FILTER_SCORE,
		className: 'col-span-6 md:col-span-3 lg:col-span-2 5xl:col-span-1'
	},
	// CHUNI_FILTER_FAVORITE,
	({
		type: 'dateSelect',
		name: 'dateRange',
		label: 'Date Range',
		value: undefined,
		className: 'col-span-6 md:col-span-3 lg:col-span-2 5xl:col-span-1',
		filter: () => false
	} as FilterField<ChuniMusic, 'dateSelect', 'dateRange'>),
	{ ...CHUNI_FILTER_WORLDS_END_STARS,
		className: 'col-span-full md:col-span-6 lg:col-span-4 5xl:col-span-2'
	},
	{ ...CHUNI_FILTER_LEVEL,
		className: 'col-span-full md:col-span-6 lg:col-span-4 5xl:col-span-2'
	},
	{ ...CHUNI_FILTER_RATING,
		className: 'col-span-full md:col-span-6 lg:col-span-4 5xl:col-span-2'
	}
] as const)

export type PlaylogFilterState = {
	[K in ArrayIndices<(typeof FILTERERS)> as (typeof FILTERERS)[K]['name']]: (typeof FILTERERS[K])['value']
};

const SORTERS = [{
	name: 'Date'
}, {
	name: 'Rating'
}, {
	name: 'Level'
}, {
	name: 'Score'
}] as const;

const PER_PAGE = [25, 50, 100, 250];

const REMOTE_FILTERERS = FILTERERS.map(({ filter, ...x }) => x);

const ChuniPlaylogGrid = ({ items }: { items: ChuniPlaylog['data'] }) => {
	const breakpoint = useBreakpoint();
	let colSize = 1000;
	let rowSize = 275;

	if (breakpoint !== 'sm' && breakpoint !== undefined) {
		colSize = 550;
		rowSize = 200;
	}

	return (<WindowScrollerGrid rowSize={rowSize} colSize={colSize} items={items}>
		{item => <div className="p-1 w-full h-full max-w-full">
			<ChuniPlaylogCard playlog={item} showDetails
				badgeClass="h-4 sm:h-5  md:-mt-3"
				className="w-full h-full max-w-full" />
		</div>}
	</WindowScrollerGrid>);
};

export const ChuniPlaylogList = () => {
	return (<FilterSorter className="flex-grow"
		filterers={REMOTE_FILTERERS}
		defaultAscending={false}
		data={({ filters: f, pageSize, currentPage, search, sort, ascending }): Promise<ChuniPlaylog> => {
			const filterState = { ...f, level: [...f.level],
				dateRange: f.dateRange ? { ...f.dateRange } : undefined } as PlaylogFilterState;
			filterState.level[0] = getLevelValFromStop(filterState.level[0]);
			filterState.level[1] = getLevelValFromStop(filterState.level[1]);
			if (filterState.dateRange?.to) {
				filterState.dateRange.to = new Date(filterState.dateRange.to);
				filterState.dateRange.to.setHours(23, 59, 59, 999);
			}

			return getPlaylog({ ...filterState, sort, limit: pageSize, offset: pageSize * (currentPage - 1), search, ascending });
		}}
		sorters={SORTERS} pageSizes={PER_PAGE}>
		{(_, d) => <div className="w-full max-w-full flex-grow my-2">
			<ChuniPlaylogGrid items={d} />
		</div>}
	</FilterSorter>);
};
