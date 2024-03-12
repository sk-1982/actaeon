'use client';

import { ChuniTopRating, ChuniTopRatingProps } from '@/components/chuni/top-rating';
import { getUserRating } from '@/actions/chuni/profile';
import { useState } from 'react';
import { Button, ButtonGroup } from '@nextui-org/react';
import { useBreakpoint } from '@/helpers/use-breakpoint';

export const ChuniTopRatingSidebar = ({ rating }: { rating: Awaited<ReturnType<typeof getUserRating>> }) => {
	const [shownRating, setShownRating] = useState<'top' | 'recent' | null>('recent');
	const breakpoint = useBreakpoint();

	if (![undefined, 'sm'].includes(breakpoint) && shownRating === null)
		setShownRating('recent');

	return (<div className="w-full mt-4 md:mt-0 px-2 sm:px-0 md:fixed md:overflow-y-auto h-fixed flex md:w-[16rem] 2xl:w-[32rem]">
		<div className="hidden 2xl:flex">
			<div className="w-1/2 pr-1">
				<div>Top</div>
				<ChuniTopRating rating={rating.top}  />
			</div>
			<div className="pl-1 w-1/2 mr-2">
				<div>Recent</div>
				<ChuniTopRating rating={rating.recent.slice(0, 10)}  />
			</div>
		</div>
		<div className="w-full flex flex-col 2xl:hidden pr-2">
			<ButtonGroup size="sm" className="mb-2 hidden md:block">
				<Button color={shownRating === 'top' ? 'primary' : 'default'} onClick={() => setShownRating('top')}>Top</Button>
				<Button color={shownRating === 'recent' ? 'primary' : 'default'} onClick={() => setShownRating('recent')}>Recent</Button>
			</ButtonGroup>
			<div className="flex items-center justify-center overflow-hidden">
				<span className="text-lg mr-6 md:hidden font-semibold pb-2">Ratings</span>
				<ButtonGroup size="md" className="mb-2 md:hidden">
					<Button color={shownRating === 'top' ? 'primary' : 'default'} onClick={() => setShownRating('top')}>Top</Button>
					<Button color={shownRating === 'recent' ? 'primary' : 'default'} onClick={() => setShownRating('recent')}>Recent</Button>
					<Button color={shownRating === null ? 'primary' : 'default'} onClick={() => setShownRating(null)}>Hide</Button>
				</ButtonGroup>
			</div>
			{shownRating && <ChuniTopRating rating={shownRating === 'top' ? rating.top : rating.recent.slice(0, 10)} />}
		</div>
	</div>);
};
