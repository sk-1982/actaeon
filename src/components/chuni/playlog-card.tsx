'use client';

import { getPlaylog } from '@/actions/chuni/playlog';
import { getJacketUrl } from '@/helpers/assets';
import Link from 'next/link';
import { ChuniRating } from '@/components/chuni/rating';
import { ChuniLampComboBadge, ChuniLampSuccessBadge, ChuniScoreBadge, getVariantFromRank } from '@/components/chuni/score-badge';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import { ChuniDifficultyContainer } from '@/components/chuni/difficulty-container';
import { formatJst } from '@/helpers/format-jst';
import { Ticker, TickerHoverProvider } from '@/components/ticker';

export type ChuniPlaylogCardProps = {
	playlog: Awaited<ReturnType<typeof getPlaylog>>['data'][number],
	className?: string
};

const getChangeSign = (val: number) => {
	if (val === 0) return '\xb1';
	if (val < 0) return '';
	return '+';
};

const getChangeColor = (val: number) => {
	if (val === 0) return 'text-gray-500';
	if (val < 0) return 'text-red-500';
	return 'text-blue-500';
};

export const ChuniPlaylogCard = ({ playlog, className }: ChuniPlaylogCardProps) => {
	return (<TickerHoverProvider>{setHover => <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
		className={`rounded-md bg-content1 relative flex flex-col p-2 pt-1 border border-black/25 ${className ?? ''}`}>
		<div className="flex">
			<div className="flex-shrink-0 mr-2 mt-auto">
				<ChuniDifficultyContainer difficulty={playlog.chartId ?? 0} className="w-28 aspect-square relative p-1">
					<ChuniLevelBadge className="absolute -bottom-1.5 -right-1.5 w-12" music={playlog}/>
					<img className="aspect-square w-full rounded overflow-hidden"
						src={getJacketUrl(`chuni/jacket/${playlog.jacketPath}`)}
						alt={playlog.title ?? ''}/>
				</ChuniDifficultyContainer>
			</div>

			<div className="flex flex-col leading-tight overflow-hidden text-nowrap w-full">
				<div className="text-xs text-right -mb-0.5 w-full">{formatJst(playlog.userPlayDate!)}</div>
				<Link href={`/chuni/music/${playlog.songId}`} lang="ja"
					className="hover:text-secondary transition mb-1 font-semibold">
					<Ticker hoverOnly noDelay><span className="underline">{playlog.title}</span></Ticker>
				</Link>
				<Ticker hoverOnly noDelay className="text-sm mb-1">{playlog.artist}</Ticker>
				<span lang="ja" className="text-sm">{playlog.genre}</span>
				<div className="text-sm flex items-center">
					Rating:&nbsp;<ChuniRating className="text-medium" rating={+playlog.rating * 100}/>
					<span className={`text-xs ${getChangeColor(playlog.playerRatingChange)}`}>&nbsp;(
						{getChangeSign(playlog.playerRatingChange)}
						{(playlog.playerRatingChange / 100).toFixed(2)}
						)</span>
				</div>
				<div className="text-xs">
					Max Combo: {playlog.maxCombo?.toLocaleString()}
				</div>
			</div>
		</div>
		<div
			className="h-5 lg:h-[1.125rem] xl:h-6 2xl:h-[1.125rem] 4xl:h-6 5xl:h-[1.125rem] my-auto flex gap-0.5 overflow-hidden">
			<ChuniScoreBadge variant={getVariantFromRank(playlog.rank ?? 0)} className="h-full">
				{playlog.score?.toLocaleString()}
			</ChuniScoreBadge>
			{!!playlog.isClear && <ChuniLampSuccessBadge success={1}/>}
			<ChuniLampComboBadge {...playlog} />
			{!!playlog.isNewRecord && <ChuniScoreBadge variant="gold" fontSize="sm">NEW RECORD</ChuniScoreBadge>}
		</div>
		<div className="flex flex-wrap text-xs justify-around drop-shadow-sm">
			<div className="mr-0.5 text-chuni-justice-critical">Justice Critical: {playlog.judgeHeaven}</div>
			<div className="mr-0.5 text-chuni-justice">Justice: {playlog.judgeCritical}</div>
			<div className="mr-0.5 text-chuni-attack">Attack: {playlog.judgeAttack}</div>
			<div className="mr-0.5 text-chuni-miss">Miss: {playlog.judgeGuilty}</div>
		</div>
	</div>}
	</TickerHoverProvider>);
};
