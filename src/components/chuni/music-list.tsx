'use client'

import { Filterers, FilterSorter, Sorter } from '@/components/filter-sorter';
import { WindowScroller, Grid, AutoSizer, List } from 'react-virtualized';
import { Button, SelectItem } from '@nextui-org/react';
import { addFavoriteMusic, getMusic, removeFavoriteMusic } from '@/actions/chuni/music';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { worldsEndStars } from '@/helpers/chuni/worlds-end-stars';
import { ChuniDifficultyContainer } from '@/components/chuni/difficulty-container';
import { getJacketUrl } from '@/helpers/assets';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import { ChuniScoreBadge, ChuniLampSuccessBadge, getVariantFromRank, ChuniLampComboBadge } from '@/components/chuni/score-badge';
import { ChuniRating } from '@/components/chuni/rating';
import Link from 'next/link';
import { HeartIcon as OutlineHeartIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon }  from '@heroicons/react/24/solid';
import { Ticker } from '@/components/ticker';
import { CHUNI_DIFFICULTIES } from '@/helpers/chuni/difficulties';
import { CHUNI_SCORE_RANKS } from '@/helpers/chuni/score-ranks';
import { CHUNI_LAMPS } from '@/helpers/chuni/lamps';
import { useErrorModal } from '@/components/error-modal';

const getLevelFromStop = (n: number) => {
	if (n < 7)
		return n + 1;
	return ((n - 6) * 0.1 + 7).toFixed(1);
};

const getLevelValFromStop = (n: number) => {
	if (n < 7)
		return n + 1;
	return ((n - 6) * 0.1 + 7);
};

export type ChuniMusicListProps = {
	music: Awaited<ReturnType<typeof getMusic>>
};

const perPage = [25, 50, 100, 250, 500, Infinity];
const sorters = [{
	name: 'Song ID',
	sort: (a, b) => a.songId! - b.songId!
}, {
	name: 'Title',
	sort: (a, b) => a.title?.localeCompare(b.title!, 'ja-JP')!
}, {
	name: 'Artist',
	sort: (a, b) => a.artist?.localeCompare(b.artist!, 'ja-JP')!
}, {
	name: 'Level',
	sort: (a, b) => a.level! - b.level!
}, {
	name: 'Score',
	sort: (a, b) => a.scoreMax! - b.scoreMax!
}, {
	name: 'Rating',
	sort: (a, b) => +a.rating! - +b.rating!
}] as Sorter<string, ChuniMusicListProps['music'][number]>[];

const searcher = (query: string, data: ChuniMusicListProps['music'][number]) => {
	return data.title?.toLowerCase().includes(query) || data.artist?.toLowerCase().includes(query);
};

const MusicGrid = ({ music, size, setMusicList }: ChuniMusicListProps & { size: 'sm' | 'lg' | 'xs', setMusicList: (m: typeof music) => void }) => {
	let itemWidth = 0;
	let itemHeight = 0;
	let itemClass = '';

	if (size === 'xs') {
		itemWidth = 125;
		itemHeight = 180;
		itemClass = 'w-[125px] h-[180px] py-0.5 px-0.5';
	} else if (size === 'sm') {
		itemWidth = 175;
		itemHeight = 235;
		itemClass = 'w-[175px] h-[235px] py-1.5 px-1';
	} else {
		itemWidth = 285;
		itemHeight = 375;
		itemClass = 'w-[285px] h-[375px] py-1.5 px-1';
	}

	const listRef = useRef<List | null>(null);
	const setError = useErrorModal();
	const [pendingFavorite, setPendingFavorite] = useState(false);

	useEffect(() => {
		listRef.current?.recomputeRowHeights(0);
	}, [size])

	return (<WindowScroller>
		{({ height, isScrolling, onChildScroll, scrollTop }) =>
			(<AutoSizer disableHeight>
				{({ width }) => {
					const itemsPerRow = Math.max(1, Math.floor(width / itemWidth));
					const rowCount = Math.ceil(music.length / itemsPerRow);

					return (<List rowCount={rowCount} autoHeight height={height} width={width} rowHeight={itemHeight} isScrolling={isScrolling}
						onScroll={onChildScroll} scrollTop={scrollTop} ref={listRef}
						rowRenderer={({ index, key, style }) => <div key={key} style={style} className="w-full h-full flex justify-center">
							{music.slice(index * itemsPerRow, (index + 1) * itemsPerRow).map(item => <div key={`${item.songId}-${item.chartId}`} className={itemClass}>
									<ChuniDifficultyContainer difficulty={item.chartId!} containerClassName="flex flex-col" className="w-full h-full border border-gray-500/75 rounded-md [&:hover_.ticker]:[animation-play-state:running]">
										<div className="aspect-square w-full p-[0.2rem] relative">
											<img src={getJacketUrl(`chuni/jacket/${item.jacketPath}`)} alt={item.title ?? 'Music'} className="rounded" />
											{item.rating && !item.worldsEndTag && <div className={`${size === 'lg' ? 'text-2xl' : ''} absolute bottom-0.5 left-0.5 bg-gray-200/60 backdrop-blur-sm px-0.5 rounded`}>
													<ChuniRating rating={+item.rating * 100} className="-my-0.5">
													{item.rating.slice(0, item.rating.indexOf('.') + 3)}
												</ChuniRating>
											</div>}
											<ChuniLevelBadge className={`${size === 'lg' ? 'h-14' : 'w-14'} absolute bottom-px right-px`} music={item} />

											<Button isIconOnly className={`absolute top-0 left-0 pt-1 bg-gray-600/25 ${item.favorite ? 'text-red-500': ''}`}
												size={size === 'xs' ? 'sm' : 'md'} variant="flat" radius="full"
												onPress={() => {
													if (pendingFavorite) return;
													const favorite = item.favorite;
													setMusicList(music.map(m => {
														if (m.songId !== item.songId)
															return m;
														return { ...m, favorite: !favorite };
													}));
													setPendingFavorite(true);
													(item.favorite ? removeFavoriteMusic : addFavoriteMusic)(item.songId!)
														.then(res => {
															if (res?.error) {
																setMusicList(music.map(m => {
																	if (m.songId !== item.songId)
																		return m;
																	return { ...m, favorite };
																}));
																return setError(`Failed to set favorite: ${res.message}`);
															}
														})
														.finally(() => setPendingFavorite(false))
												}}>
												{item.favorite ? <SolidHeartIcon className="w-3/4" /> : <OutlineHeartIcon className="w-3/4" />}
											</Button>
										</div>
										<div className="px-0.5 mb-1 flex">
											{size === 'lg' && <div className="h-full w-1/3 mr-0.5">
												{item.isSuccess ? <ChuniLampSuccessBadge success={item.isSuccess} /> : null}
											</div>}

											<div className={`h-full ${size === 'lg' ? 'w-1/3' : 'w-1/2'}`}>
												{item.scoreRank !== null && <ChuniScoreBadge variant={getVariantFromRank(item.scoreRank)} className="h-full">
													{item.scoreMax!.toLocaleString()}
                        </ChuniScoreBadge>}
											</div>

											<div className={`h-full ml-0.5 ${size === 'lg' ? 'w-1/3' : 'w-1/2'}`}>
												<ChuniLampComboBadge {...item} />
											</div>
										</div>
										<Link href={`/chuni/music/${item.songId}`}
											className={`${size === 'lg' ? 'text-lg' : 'text-xs'} mt-auto px-1 block text-white hover:text-gray-200 transition text-center font-semibold drop-shadow-lg`}>
											<Ticker hoverOnly noDelay>{item.title}</Ticker>
										</Link>
										<Ticker className={`${size === 'lg' ? 'text-medium mb-1.5' : 'text-xs mb-0.5' } text-center px-1 drop-shadow-2xl text-white`} hoverOnly noDelay>{item.artist}</Ticker>
									</ChuniDifficultyContainer>
							</div>)}
						</div>} />)
				}}
			</AutoSizer>)}
	</WindowScroller>);
};

const DISPLAY_MODES = [{
	name: 'Extra Small Grid',
	icon: <Squares2X2Icon />
}, {
	name: 'Small Grid',
	icon: <Squares2X2Icon />
}, {
	name: 'Large Grid',
	icon: <Squares2X2Icon />
}];

const DISPLAY_IDS = {
	'Extra Small Grid': 'xs',
	'Small Grid': 'sm',
	'Large Grid': 'lg'
} as const;

export const ChuniMusicList = ({ music }: ChuniMusicListProps) => {
	const [localMusic, setLocalMusic] = useState(music);

	const { filterers } = useMemo(() => {
		const genres = new Set<string>();
		const worldsEndTags = new Set<string>();

		music.forEach(m => {
			if (m.genre) genres.add(m.genre);
			if (m.worldsEndTag) worldsEndTags.add(m.worldsEndTag);
		});

		const filterers = [{
			type: 'select',
			name: 'difficulty',
			label: 'Difficulty',
			value: new Set<string>(),
			className: 'col-span-6 md:col-span-3 5xl:col-span-1',
			props: {
				children: CHUNI_DIFFICULTIES.map((name, i) => <SelectItem key={i.toString()} value={i.toString()}>
					{name}
				</SelectItem>),
				selectionMode: 'multiple'
			},
			filter: (val: Set<string>, data) => !val.size || val.has(data.chartId?.toString()!)
		}, {
			type: 'select',
			name: 'genre',
			label: 'Genre',
			value: new Set<string>(),
			className: 'col-span-6 md:col-span-3 5xl:col-span-1',
			props: {
				children: [...genres].sort()
					.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>),
				selectionMode: 'multiple'
			},
			filter: (val: Set<string>, data) => !val.size || val.has(data.genre!)
		}, {
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
		}, {
			type: 'select',
			name: 'worldsEndTag',
			label: 'World\'s End Tag',
			value: new Set<string>(),
			className: 'col-span-6 md:col-span-3 lg:col-span-2 xl:col-span-2 5xl:col-span-1',
			props: {
				children: [...worldsEndTags].sort()
					.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>),
				selectionMode: 'multiple'
			},
			filter: (val: Set<string>, data) => !val.size || !data.worldsEndTag || val.has(data.worldsEndTag)
		}, {
			type: 'select',
			name: 'score',
			label: 'Score',
			value: new Set<string>(),
			className: 'col-span-full sm:col-span-6 md:col-span-4 lg:col-span-2 xl:col-span-2 5xl:col-span-1',
			props: {
				children: CHUNI_SCORE_RANKS
					.map((s, i) => <SelectItem key={i.toString()} value={i.toString()}>{s}</SelectItem>)
					.reverse(),
				selectionMode: 'multiple'
			},
			filter: (val: Set<string>, data) => !val.size || val.has(data.scoreRank?.toString()!)
		}, {
			type: 'slider',
			name: 'worldsEndStars',
			label: 'World\'s End Stars',
			value: [1, 5],
			className: 'col-span-full sm:col-span-6 md:col-span-4 5xl:col-span-2',
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
		}, {
			type: 'slider',
			name: 'level',
			label: 'Level',
			value: [0, 90],
			className: 'col-span-full md:col-span-4 5xl:col-span-2',
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
					`${getLevelFromStop(v[0])}\u2013${getLevelFromStop(v[1])}` : getLevelFromStop(v)
			}
		}, {
			type: 'slider',
			name: 'rating',
			label: 'Rating',
			value: [0, 17.55],
			className: 'col-span-full md:col-span-full lg:col-span-4 5xl:col-span-3',
			filter: ([a, b]: number[], val) => {
				if (val.worldsEndTag) return true;
				return +val.rating >= a && +val.rating <= b;
			},
			props: {
				maxValue: 17.55,
				minValue: 0,
				step: 0.01
			}
		}] as Filterers<(typeof music)[number], string>;

		return { filterers };
	}, [music]);

	return (
		<FilterSorter className="flex-grow" data={localMusic} sorters={sorters} filterers={filterers} pageSizes={perPage}
			displayModes={DISPLAY_MODES} searcher={searcher}>
			{(displayMode, data) => <div className="w-full flex-grow my-2">
				<MusicGrid music={data} size={DISPLAY_IDS[displayMode as keyof typeof DISPLAY_IDS]} setMusicList={setLocalMusic} />
			</div>}
		</FilterSorter>);
};
