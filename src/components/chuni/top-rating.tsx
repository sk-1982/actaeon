import { getUserRating } from '@/actions/chuni/profile';
import { getJacketUrl } from '@/helpers/assets';
import { ChuniRating } from '@/components/chuni/rating';
import { floorToDp } from '@/helpers/floor-dp';
import { ChuniScoreBadge, getVariantFromRank, getVariantFromScore } from '@/components/chuni/score-badge';
import { ChuniDifficultyContainer } from '@/components/chuni/difficulty-container';
import { Tooltip } from '@nextui-org/react';
import { ChuniLevelBadge } from '@/components/chuni/level-badge';
import Link from 'next/link';

export type ChuniTopRatingProps = {
	className?: string,
	rating: Awaited<ReturnType<typeof getUserRating>>['recent' | 'top']
};

export const ChuniTopRating = ({ rating, className }: ChuniTopRatingProps) => {
	return (<div className={`flex flex-col ${className ?? ''}`}>
		{rating.map((music, i) => <div key={i} className="flex py-2 h-28 border-b border-gray-500">
			<ChuniDifficultyContainer difficulty={music.chartId ?? 0} className="flex-shrink-0 w-20 mr-2 self-center">
				<div className="p-1">
					<img className="aspect-square rounded overflow-hidden" src={getJacketUrl(`chuni/jacket/${music.jacketPath}`)}
						alt={music.title ?? ''} />
				</div>
				<ChuniLevelBadge className="w-11 absolute -right-0.5 -bottom-0.5" music={music} />
			</ChuniDifficultyContainer>

			<div className="flex flex-col text-sm self-top flex-grow">
				<Link href={`/chuni/music/${music.songId}`}>{i + 1}: <span className="underline hover:text-secondary transition">{music.title}</span></Link>
				<div className="flex items-baseline mt-auto">
					<ChuniRating rating={+music.rating * 100} className={"text-xs"}>RATING&nbsp;</ChuniRating>
					<ChuniRating rating={+music.rating * 100} className="text-medium">{floorToDp(music.rating, 2)}</ChuniRating>
				</div>
				<div className="mt-1 flex items-center">
					<ChuniScoreBadge className="h-5" variant={getVariantFromScore(+(music.scoreMax ?? 0))}>{music.scoreMax?.toLocaleString()}</ChuniScoreBadge>
					{('pastIndex' in music) && <Tooltip content={`Played ${music.pastIndex + 1} songs ago`}><div className="ml-auto">-{music.pastIndex+1}</div></Tooltip>}
				</div>
			</div>
		</div>)}
	</div>)
};
