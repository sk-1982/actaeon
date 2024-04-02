'use client'

import { FilterSorter, Sorter } from '@/components/filter-sorter';
import { Button } from '@nextui-org/react';
import { addFavoriteMusic, ChuniMusic, removeFavoriteMusic } from '@/actions/chuni/music';
import { useState } from 'react';
import { ChuniDifficultyContainer } from '@/components/chuni/difficulty-container';
import { getJacketUrl } from '@/helpers/assets';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import { ChuniScoreBadge, ChuniLampSuccessBadge, getVariantFromRank, ChuniLampComboBadge } from '@/components/chuni/score-badge';
import { ChuniRating } from '@/components/chuni/rating';
import Link from 'next/link';
import { HeartIcon as OutlineHeartIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon }  from '@heroicons/react/24/solid';
import { Ticker, TickerHoverProvider } from '@/components/ticker';
import { useErrorModal } from '@/components/error-modal';
import { CHUNI_FILTER_DIFFICULTY, CHUNI_FILTER_FAVORITE, CHUNI_FILTER_GENRE, CHUNI_FILTER_LAMP, CHUNI_FILTER_LEVEL, CHUNI_FILTER_RATING, CHUNI_FILTER_SCORE, CHUNI_FILTER_WORLDS_END_STARS, CHUNI_FILTER_WORLDS_END_TAG } from '@/helpers/chuni/filter';
import { WindowScrollerGrid } from '@/components/window-scroller-grid';

export type ChuniMusicListProps = {
	music: ChuniMusic[]
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

const MusicGrid = ({ music, size, setMusicList, fullMusicList }: ChuniMusicListProps & {
	size: 'sm' | 'lg' | 'xs',
	setMusicList: (m: typeof music) => void,
	fullMusicList: ChuniMusicListProps['music']
}) => {
	let itemWidth = 0;
	let itemHeight = 0;
	let itemClass = '';

	if (size === 'xs') {
		itemWidth = 125;
		itemHeight = 180;
		itemClass = 'py-0.5 px-0.5 h-full block';
	} else if (size === 'sm') {
		itemWidth = 175;
		itemHeight = 235;
		itemClass = 'py-1.5 px-1 h-full block';
	} else {
		itemWidth = 285;
		itemHeight = 375;
		itemClass = 'py-1.5 px-1 h-full block';
	}

	const setError = useErrorModal();
	const [pendingFavorite, setPendingFavorite] = useState(false);

	return (<WindowScrollerGrid rowSize={itemHeight} colSize={itemWidth} items={music}>
		{item => <TickerHoverProvider>
			{setHover => 	<div className={itemClass}><ChuniDifficultyContainer difficulty={item.chartId!}
				containerClassName="flex flex-col"
				className="w-full h-full border border-gray-500/75 rounded-md"
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}>
				<div className="aspect-square w-full p-[0.2rem] relative">
					<Link href={`/chuni/music/${item.songId}`}>
						<img src={getJacketUrl(`chuni/jacket/${item.jacketPath}`)} alt={item.title ?? 'Music'} className="rounded" />
					</Link>
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
							setMusicList(fullMusicList.map(m => {
								if (m.songId !== item.songId)
									return m;
								return { ...m, favorite: !favorite };
							}));
							setPendingFavorite(true);
							(item.favorite ? removeFavoriteMusic : addFavoriteMusic)(item.songId!)
								.then(res => {
									if (res?.error) {
										setMusicList(fullMusicList.map(m => {
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
			</ChuniDifficultyContainer></div>}
		</TickerHoverProvider>}
	</WindowScrollerGrid>);
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

const FILTERERS = [
	CHUNI_FILTER_DIFFICULTY,
	CHUNI_FILTER_GENRE,
	CHUNI_FILTER_LAMP,
	CHUNI_FILTER_WORLDS_END_TAG,
	CHUNI_FILTER_SCORE,
	CHUNI_FILTER_FAVORITE,
	CHUNI_FILTER_WORLDS_END_STARS,
	CHUNI_FILTER_LEVEL,
	CHUNI_FILTER_RATING
];

export const ChuniMusicList = ({ music }: ChuniMusicListProps) => {
	const [localMusic, setLocalMusic] = useState(music);

	return (
		<FilterSorter className="flex-grow" data={localMusic} sorters={sorters} filterers={FILTERERS} pageSizes={perPage}
			displayModes={DISPLAY_MODES} searcher={searcher}>
			{(displayMode, data) => <div className="w-full flex-grow my-2">
				<MusicGrid music={data} size={DISPLAY_IDS[displayMode as keyof typeof DISPLAY_IDS]}
					fullMusicList={localMusic} setMusicList={setLocalMusic} />
			</div>}
		</FilterSorter>);
};
