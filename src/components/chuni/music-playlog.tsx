'use client';

import { getMusic } from '@/actions/chuni/music';
import { getPlaylog } from '@/actions/chuni/playlog';
import { Accordion, AccordionItem } from '@nextui-org/react';
import { CHUNI_DIFFICULTIES } from '@/helpers/chuni/difficulties';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import { ChuniRating } from '@/components/chuni/rating';
import { ChuniLampComboBadge, ChuniLampSuccessBadge, ChuniScoreBadge, getVariantFromLamp, getVariantFromRank } from '@/components/chuni/score-badge';
import { CHUNI_SCORE_RANKS } from '@/helpers/chuni/score-ranks';
import {  CHUNI_LAMPS } from '@/helpers/chuni/lamps';
import { ChuniPlaylogCard } from '@/components/chuni/playlog-card';
import { useState } from 'react';

type ChuniMusicPlaylogProps = {
	music: Awaited<ReturnType<typeof getMusic>>,
	playlog: Awaited<ReturnType<typeof getPlaylog>>
};

export const ChuniMusicPlaylog = ({ music, playlog }: ChuniMusicPlaylogProps) => {
	type Music = (typeof music)[number];
	type Playlog = (typeof playlog)['data'][number];
	const defaultExpanded: Record<string, Set<string>> = {}

	const difficulties: (Music & { playlog: Playlog[] })[] = [];
	music.forEach(m => {
		difficulties[m.chartId!] = { ...m, playlog: [] };
	});

	playlog.data.forEach(play => {
		defaultExpanded[play.chartId!] = new Set();
		difficulties[play.chartId!].playlog.push(play);
	});

	const [expanded, setExpanded] = useState(defaultExpanded);

	const badgeClass = 'h-6 sm:h-8';

	return (<div className="flex flex-col w-full px-2 sm:px-0">
		{difficulties.map((data, i) => {
			const rank = CHUNI_SCORE_RANKS[data.scoreRank!];
			const badges = [
				!!data.scoreRank && <ChuniScoreBadge variant={getVariantFromRank(data.scoreRank)} className={`${badgeClass} tracking-[0.05cqw]`} key="1">
					{rank.endsWith('+') ? <>
						{rank.slice(0, -1)}
						<div className="inline-block translate-y-[-15cqh]">+</div>
					</> : rank}
				</ChuniScoreBadge>,
				data.isSuccess ? <ChuniLampSuccessBadge key="2" className={badgeClass} success={data.isSuccess} /> : null,
				<ChuniLampComboBadge key="3" className={badgeClass} {...data} />
			].filter(x => x);

			const toggleExpanded = () => expanded[i] && setExpanded(e =>
				({ ...e,
					[i]: e[i].size ? new Set() : new Set(['1'])
				}));

			return (<div key={i} className="mb-2 border-b pb-2 border-gray-500 flex flex-row flex-wrap">
				<div className={`flex items-center gap-2 flex-wrap w-full lg:w-auto lg:flex-grow ${data.playlog.length ? 'cursor-pointer' : ''}`} onClick={toggleExpanded}>
					<div className="flex items-center">
						<div className="w-14 mr-2 p-0.5 bg-black">
							<ChuniLevelBadge className="w-full" music={data} />
						</div>
						<div className="text-xl font-semibold">{CHUNI_DIFFICULTIES[i]}</div>
					</div>
					{!data.playlog.length && <div className="text-right italic text-gray-500 flex-grow">No Play History</div>}
					{data.rating ? <ChuniRating className="text-2xl text-right" rating={+data.rating * 100} /> : null}
					{data.scoreMax ? <div className="ml-2 text-center flex-grow sm:flex-grow-0">
						<span className="font-semibold">High Score: </span>{data.scoreMax.toLocaleString()}
					</div> : null}
				</div>
				{badges.length ? <div className={`flex-grow lg:flex-grow-0 ml-auto mr-auto sm:ml-0 lg:ml-auto lg:mr-0 mt-2 flex gap-0.5 flex-wrap justify-center sm:justify-start ${data.playlog.length ? 'cursor-pointer' : ''}`} onClick={toggleExpanded}>
					{badges}
				</div> : null}
				{data.playlog.length ? <Accordion selectedKeys={expanded[i]} onSelectionChange={k => setExpanded(e => ({ ...e, [i]: k as any }))}>
					<AccordionItem key="1" title="Play History">
						<div className="grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 5xl:grid-cols-6 6xl:grid-cols-8 gap-2">
							{data.playlog.map(p => <ChuniPlaylogCard key={p.id} playlog={p} className="h-48" />)}
						</div>
					</AccordionItem>
					</Accordion> : null
				}
			</div>)
		})}
	</div>);
};
