import { ReactNode, HTMLAttributes } from 'react';

const BACKGROUNDS = [
	['bg-[#02a076]'],
	['bg-[#ee7708]'],
	['bg-[#e02b29]'],
	['bg-[#7e18ca]'],
	['bg-[length:400%] bg-[linear-gradient(135deg,rgba(31,31,31,1)_0%,rgba(31,31,31,1)_1%,rgba(252,40,85,1)_1%,rgba(252,40,85,1)_4%,rgba(31,31,31,1)_4%,rgba(31,31,31,1)_8%,rgba(38,33,33,1)_8%,rgba(38,33,33,1)_9%,rgba(31,31,31,1)_9%,rgba(31,31,31,1)_10%,rgba(38,33,33,1)_10%,rgba(38,33,33,1)_12%,rgba(31,31,31,1)_12%,rgba(31,31,31,1)_14%,rgba(252,40,85,1)_14%,rgba(252,40,85,1)_16%,rgba(31,31,31,1)_16%,rgba(31,31,31,1)_17%,rgba(252,40,85,1)_17%,rgba(252,40,85,1)_21%,rgba(31,31,31,1)_21%,rgba(31,31,31,1)_33%,rgba(252,40,85,1)_33%)]'],
	[
		'bg-[linear-gradient(135deg,rgba(255,0,54,1)_0%,rgba(255,0,54,1)_10%,rgba(255,154,0,1)_10%,rgba(255,154,0,1)_20%,rgba(208,222,33,1)_20%,rgba(208,222,33,1)_30%,rgba(79,220,74,1)_30%,rgba(79,220,74,1)_40%,rgba(63,218,216,1)_40%,rgba(63,218,216,1)_50%,rgba(47,201,226,1)_50%,rgba(47,201,226,1)_60%,rgba(28,127,238,1)_60%,rgba(28,127,238,1)_70%,rgba(95,21,242,1)_70%,rgba(95,21,242,1)_80%,rgba(186,12,248,1)_80%,rgba(186,12,248,1)_90%,rgba(251,7,217,1)_90%)]',
		'mix-blend-multiply bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_0%,rgba(241,241,241,1)_20%,rgba(233,233,233,1)_20%,rgba(204,204,204,1)_40%,rgba(222,222,222,1)_40%,rgba(222,222,222,1)_60%,rgba(238,238,238,1)_60%,rgba(208,208,208,1)_60%,rgba(238,238,238,1)_80%,rgba(255,255,255,1)_80%,rgba(235,235,235,1)_100%)]'
	],
] as const;

export type ChuniDifficultyContainerProps = {
	children?: ReactNode,
	className?: string,
	difficulty: number,
	containerClassName?: string
} & HTMLAttributes<HTMLDivElement>;

export const ChuniDifficultyContainer = ({ children, className, difficulty, containerClassName, ...props }: ChuniDifficultyContainerProps) => {
	return (<div className={`relative ${className ?? ''}`} {...props}>
		{BACKGROUNDS[difficulty].map((className, i) => <div className={`${className} w-full h-full absolute inset-0 z-0 rounded`} key={i} />)}
		<div className={`z-0 relative w-full h-full ${containerClassName ?? ''}`}>{children}</div>
	</div>)
};
