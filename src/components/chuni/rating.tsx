import { ReactNode } from 'react';

export type ChuniRatingProps = {
	children?: ReactNode,
	className?: string,
	rating?: number | string | null
};

export const ChuniRating = ({ children, rating, className }: ChuniRatingProps) => {
	if (rating === undefined || rating === null)
		return null;

	let bg = '';
	let ratingNum = +rating;
	if (ratingNum < 400)
		bg = 'bg-[#02a076]';
	else if (ratingNum < 700)
		bg = 'bg-[#ee7708]';
	else if (ratingNum < 1000)
		bg = 'bg-[#e02b29]';
	else if (ratingNum < 1200)
		bg = 'bg-[#7e18ca]';
	else if (ratingNum < 1325)
		bg = 'bg-[linear-gradient(180deg,rgba(241,156,118,1)_0%,rgba(247,172,127,1)_50%,rgba(216,135,83,1)_50%,rgba(251,177,132,1)_100%)]';
	else if (ratingNum < 1450)
		bg = 'bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(223,255,255,1)_50%,rgba(191,240,255,1)_50%,rgba(245,254,253,1)_100%)]';
	else if (ratingNum < 1525)
		bg = 'bg-[linear-gradient(180deg,rgba(251,255,189,1)_0%,rgba(255,255,130,1)_47%,rgba(241,194,75,1)_53%,rgba(231,177,77,1)_100%)]';
	else if (ratingNum < 1600)
		bg = 'bg-[linear-gradient(180deg,rgba(251,255,205,1)_0%,rgba(255,255,223,1)_47%,rgba(255,244,168,1)_53%,rgba(255,254,188,1)_100%)]'
	else
		bg = 'bg-[linear-gradient(180deg,rgba(255,0,0,1)_0%,rgba(255,64,0,1)_25%,rgba(255,255,0,1)_50%,rgba(0,255,0,1)_60%,rgba(0,64,255,1)_80%)]'

	return (<div className={`bg-clip-text text-transparent text-stroke text-stroke-black font-extrabold font-helvetica ${bg} ${className ?? ''}`}>
		{children ?? (ratingNum / 100).toFixed(2)}
	</div>)
}

