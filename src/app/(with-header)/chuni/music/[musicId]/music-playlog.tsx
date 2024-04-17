'use client';

import { ChuniMusic } from '@/actions/chuni/music';
import { ChuniPlaylog } from '@/actions/chuni/playlog';
import { Accordion, AccordionItem } from '@nextui-org/accordion';
import { CHUNI_DIFFICULTIES } from '@/helpers/chuni/difficulties';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import { ChuniRating } from '@/components/chuni/rating';
import { ChuniLampComboBadge, ChuniLampSuccessBadge, ChuniScoreBadge, ChuniScoreRankBadge, getVariantFromRank } from '@/components/chuni/score-badge';
import { ChuniPlaylogCard } from '@/components/chuni/playlog-card';
import { useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '@nextui-org/tooltip';
import { ChuniScoreCalculator, ChuniScoreCalculatorProps } from '@/components/chuni/score-calculator';
import { ChuniUserRating } from '@/actions/chuni/profile';
import { Spacer } from '@nextui-org/spacer';

type ChuniMusicPlaylogProps = {
	music: ChuniMusic[],
	playlog: ChuniPlaylog,
	rating: ChuniUserRating
};

export const ChuniMusicPlaylog = ({ music, playlog, rating }: ChuniMusicPlaylogProps) => {
	type Music = (typeof music)[number];
	type Playlog = (typeof playlog)['data'][number];

	const [selected, setSelected] = useState(new Set<string>());
	const [scoreCalculator, setScoreCalculator] = useState<ChuniScoreCalculatorProps['music']>(null);

	const difficulties: (Music & { playlog: Playlog[] })[] = [];
	music.forEach(m => {
		difficulties[m.chartId!] = { ...m, playlog: [] };
	});

	playlog.data.forEach(play => {
		difficulties[play.chartId!].playlog.push(play);
	});

	const badgeClass = 'h-6 sm:h-8';

	return (<div className="flex flex-col w-full px-1 sm:px-0">
		<ChuniScoreCalculator music={scoreCalculator} topRating={rating} onClose={() => setScoreCalculator(null)} />
		<Accordion selectionMode="multiple" selectedKeys={selected}>
			{difficulties.map((data, i) => {
				const badges = [
					data.scoreRank !== null && <ChuniScoreRankBadge key="1" rank={data.scoreRank} className={badgeClass} />,
					data.isSuccess ? <ChuniLampSuccessBadge key="2" className={badgeClass} success={data.isSuccess} /> : null,
					(data.isFullCombo || data.isAllJustice) && <ChuniLampComboBadge key="3" className={badgeClass} {...data} />
				].filter(x => x);

				return (<AccordionItem key={i.toString()} classNames={{ trigger: 'py-0 my-2' }} onClick={() => {
						const key = i.toString();
						setSelected(s => s.has(key) ? new Set([...s].filter(k => k !== key)) : new Set([...s, key]))
					}} title={<div className="flex flex-row flex-wrap items-center gap-y-1.5 -mr-3">
					<div className={`flex items-center gap-2 flex-wrap lg:flex-grow ${data.playlog.length ? 'cursor-pointer w-full lg:w-auto' : 'flex-grow'}`}>
						<div className="flex items-center">
							<div className="w-14 mr-2 p-0.5 bg-black">
								<ChuniLevelBadge className="w-full" music={data} />
							</div>
							<div className="text-xl font-semibold">{CHUNI_DIFFICULTIES[i]}</div>
						</div>
						{!data.playlog.length && <div className="text-right italic text-gray-500 flex-grow">No Play History</div>}
						{data.rating && data.chartId !== 5 ? <ChuniRating className="text-2xl text-right" rating={+data.rating * 100} /> : null}
						{data.scoreMax ? <div className="ml-2 text-center flex-grow sm:flex-grow-0 max-sm:text-sm">
							<span className="font-semibold">High Score: </span>{data.scoreMax.toLocaleString()}
						</div> : null}
						{data.maxComboCount ? <div className="ml-2 text-center flex-grow sm:flex-grow-0 max-sm:text-sm">
							<span className="font-semibold">Max Combo: </span>{data.maxComboCount.toLocaleString()}
						</div> : null}
					</div>
					{badges.length ? <div className={`flex-grow items-center lg:flex-grow-0 ml-auto mr-auto sm:ml-0 lg:ml-auto lg:mr-0 flex gap-0.5 flex-wrap justify-center sm:justify-start ${data.playlog.length ? 'cursor-pointer' : ''}`}>
						{badges}
					</div> : null}
					{data.chartId !== 5 ? <Tooltip content="Score calculator">
						<div className="ml-2 text-gray-400 rounded-full w-10 h-10 flex items-center justify-center transition hover:bg-default"
							onClick={e => {
								e.stopPropagation();
								setScoreCalculator(data);
							}}>
							<CalculatorIcon className="h-3/4" />
						</div>
					</Tooltip> : <Spacer />}

				</div>}>
					<div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 justify-center sm:justify-end max-sm:text-xs">
						<span className="mr-auto max-sm:w-full text-center"><span className="font-semibold">Chart designer:</span> {data.chartDesigner}</span>
						{!!data.tapJudgeCount && <span><span className="font-semibold">Tap:</span> {data.tapJudgeCount}</span>}
						{!!data.flickJudgeCount && <span><span className="font-semibold">Flick:</span> {data.flickJudgeCount}</span>}
						{!!data.holdJudgeCount && <span><span className="font-semibold">Hold:</span> {data.holdJudgeCount}</span>}
						{!!data.slideJudgeCount && <span><span className="font-semibold">Slide:</span> {data.slideJudgeCount}</span>}
						{!!data.airJudgeCount && <span><span className="font-semibold">Air:</span> {data.airJudgeCount}</span>}
					</div>
					<div className="grid  grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 5xl:grid-cols-5 6xl:grid-cols-6 gap-2">
						{data.playlog.map(p => <ChuniPlaylogCard key={p.id}
							showDetails
							badgeClass="h-5 sm:h-6 md:h-5 lg:h-[1.125rem] 3xl:h-5 md:-mt-1"
							playlog={p} className="h-64 md:h-52" />)}
					</div>
				</AccordionItem>);
			})}
		</Accordion>
	</div>);
};
