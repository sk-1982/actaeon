'use client';

import { ChuniTopRating } from './top-rating';
import { ChuniUserRating } from '@/actions/chuni/profile';
import { useState } from 'react';
import { ButtonGroup, Button } from '@nextui-org/button';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { BigDecimal } from '@/helpers/big-decimal';
import { ChuniRating } from '@/components/chuni/rating';

export const ChuniTopRatingSidebar = ({ rating }: { rating: ChuniUserRating }) => {
	const [shownRating, setShownRating] = useState<'top' | 'recent' | null>('recent');
	const breakpoint = useBreakpoint();

	const recent = rating.recent.slice(0, 10);
	const topAvg = rating.top.reduce((t, x) => t.add(x.rating), new BigDecimal(0))
		.div(30, 2n);
	const recentAvg = recent.reduce((t, x) => t.add(x.rating), new BigDecimal(0))
		.div(10, 2n);

	if (![undefined, 'sm'].includes(breakpoint) && shownRating === null)
		setShownRating('recent');

	return (<div className="w-full mt-4 md:mt-0 px-2 sm:px-0 md:fixed md:overflow-y-auto h-fixed flex md:w-[16rem] 2xl:w-[32rem]">
		<div className="hidden 2xl:flex">
			<div className="w-1/2 pr-1">
				<div className="flex items-baseline">
					<span>Top&nbsp;</span>
					<ChuniRating className="text-xl" rating={+topAvg.mul(100)}>{ topAvg.toFixed(2) }</ChuniRating>
				</div>
				<ChuniTopRating rating={rating.top}  />
			</div>
			<div className="pl-1 w-1/2 mr-2">
				<div className="flex items-baseline">
					<span>Recent&nbsp;</span>
					<ChuniRating className="text-xl" rating={+recentAvg.mul(100)}>{ recentAvg.toFixed(2) }</ChuniRating>
				</div>
				<ChuniTopRating rating={recent}  />
			</div>
		</div>
		<div className="w-full flex flex-col 2xl:hidden pr-2">
			<div className="mb-2 hidden md:flex">
				<ButtonGroup size="sm" className="">
					<Button color={shownRating === 'top' ? 'primary' : 'default'} onClick={() => setShownRating('top')}>Top</Button>
					<Button color={shownRating === 'recent' ? 'primary' : 'default'} onClick={() => setShownRating('recent')}>Recent</Button>
				</ButtonGroup>
				<ChuniRating className="ml-auto text-xl" rating={+(shownRating === 'top' ? topAvg : recentAvg).mul(100)}>
					{(shownRating === 'top' ? topAvg : recentAvg).toFixed(2)}
				</ChuniRating>
			</div>
			<div className="flex items-center max-w-full md:hidden flex-wrap">
				{shownRating && <div className="flex items-baseline mb-2 mr-auto">
						Average:&nbsp;
					<ChuniRating className="text-xl" rating={+(shownRating === 'top' ? topAvg : recentAvg).mul(100)}>
						{(shownRating === 'top' ? topAvg : recentAvg).toFixed(2)}
					</ChuniRating>
				</div>}
				<div className="ml-auto flex items-center justify-center flex-wrap">
					<span className="text-lg mr-6 font-semibold pb-2">Ratings</span>
					<ButtonGroup size="md" className="mb-2 h-full">
						<Button color={shownRating === 'top' ? 'primary' : 'default'} onClick={() => setShownRating('top')}>Top</Button>
						<Button color={shownRating === 'recent' ? 'primary' : 'default'} onClick={() => setShownRating('recent')}>Recent</Button>
						<Button color={shownRating === null ? 'primary' : 'default'} onClick={() => setShownRating(null)}>Hide</Button>
					</ButtonGroup>
				</div>
			</div>
			{shownRating && <ChuniTopRating rating={shownRating === 'top' ? rating.top : rating.recent.slice(0, 10)} />}
		</div>
	</div>);
};
