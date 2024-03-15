import { ReactNode } from 'react';
import { CHUNI_LAMPS } from '@/helpers/chuni/lamps';

const BACKGROUNDS = [
	'bg-[linear-gradient(135deg,rgba(120,120,120,1)_30%,rgba(90,91,90,1)_50%,rgba(172,170,170,1)_50%,rgba(115,114,114,1)_63%,rgba(98,98,98,1)_80%,rgba(129,129,129,1)_100%)]',
	'bg-[linear-gradient(135deg,rgba(243,111,5,1)_30%,rgba(164,77,8,1)_50%,rgba(249,114,8,1)_50%,rgba(181,83,5,1)_80%,rgba(243,111,5,1)_100%)]',
	'bg-[linear-gradient(135deg,rgba(33,251,255,1)_5%,rgba(25,210,212,1)_5%,rgba(25,231,233,1)_10%,rgba(75,249,252,1)_10%,rgba(27,236,240,1)_15%,rgba(33,251,255,1)_15%,rgba(31,203,207,1)_25%,rgba(74,219,230,1)_25%,rgba(51,162,171,1)_50%,rgba(137,255,255,1)_50%,rgba(92,219,219,1)_75%,rgba(112,251,255,1)_75%,rgba(95,234,238,1)_85%,rgba(95,218,222,1)_85%,rgba(87,223,227,1)_90%,rgba(98,251,255,1)_90%,rgba(94,242,246,1)_95%,rgba(112,251,255,1)_95%)]',
	'bg-[linear-gradient(135deg,rgba(240,211,40,1)_5%,rgba(255,219,8,1)_5%,rgba(255,219,8,1)_10%,rgba(255,243,47,1)_10%,rgba(255,243,47,1)_15%,rgba(255,221,52,1)_15%,rgba(251,222,80,1)_25%,rgba(255,171,34,1)_25%,rgba(255,114,2,1)_50%,rgba(255,231,8,1)_50%,rgba(255,208,48,1)_75%,rgba(255,224,52,1)_75%,rgba(255,224,52,1)_85%,rgba(255,219,18,1)_85%,rgba(255,219,18,1)_90%,rgba(245,249,67,1)_90%,rgba(245,249,67,1)_95%,rgba(239,244,47,1)_95%)]',
	'text-[#0831b5] bg-[linear-gradient(135deg,rgba(255,255,132,1)_0%,rgba(255,255,132,1)_5%,rgba(101,255,101,1)_5%,rgba(101,255,101,1)_10%,rgba(255,86,86,1)_10%,rgba(255,86,86,1)_15%,rgba(255,128,0,1)_15%,rgba(255,128,0,1)_20%,rgba(255,255,132,1)_20%,rgba(255,255,132,1)_25%,rgba(255,255,255,1)_25%,rgba(250,243,175,1)_35%,rgba(250,247,239,1)_50%,rgba(250,243,175,1)_65%,rgba(255,255,255,1)_75%,rgba(255,200,103,1)_75%,rgba(255,200,103,1)_80%,rgba(245,146,111,1)_80%,rgba(245,146,111,1)_85%,rgba(247,255,129,1)_85%,rgba(247,255,129,1)_90%,rgba(119,252,113,1)_90%,rgba(119,252,113,1)_95%,rgba(119,252,113,1)_95%,rgba(106,139,250,1)_95%)]'
];

const ChuniScoreBadgeVariant = {
	fail: 0,
	bronze: 1,
	silver: 2,
	gold: 3,
	platinum: 4
} as const;

type Variant = keyof typeof ChuniScoreBadgeVariant | (typeof ChuniScoreBadgeVariant)[keyof typeof ChuniScoreBadgeVariant];

const RANK_VARIANTS = [0, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4] as const;

export const CHUNI_LAMP_DISPLAY = new Map<number, Variant>([
	[1, 'gold'],
	[2, 'gold'],
	[3, 'gold'],
	[4, 'platinum'],
	[5, 'platinum'],
	[6, 'platinum']
]);

export const getVariantFromRank = (rank: number): Variant => {
	return RANK_VARIANTS[rank];
}

export const getVariantFromScore = (score: number): Variant => {
	if (score >= 975000)
		return 4;
	if (score >= 900000)
		return 3;
	if (score >= 600000)
		return 2;
	if (score >= 500000)
		return 1;
	return 0;
};

export const getVariantFromLamp = (lamp: number): Variant => {
	return CHUNI_LAMP_DISPLAY.get(lamp)!
};

export type ChuniScoreBadgeProps = {
	children: ReactNode,
	variant: Variant,
	className?: string,
	fontSize?: 'xs' | 'sm' | 'md'
};

const sizes = {
	xs: 'text-[52cqh]',
	sm: 'text-[59cqh]',
	md: 'text-[70cqh]'
}

export const ChuniScoreBadge = ({ children, variant, className, fontSize }: ChuniScoreBadgeProps) => {
	const size = sizes[fontSize ?? 'md'];

	return (<div className={`aspect-[72/16] font-helvetica ${className ?? ''}`}>
		<div className="@container-size w-full h-full text-black">
			<div className={`${BACKGROUNDS[typeof variant === 'number' ? variant : ChuniScoreBadgeVariant[variant]]} w-full h-full flex items-center justify-center border-black border`}>
				<span className={`font-bold drop-shadow-[0_0_25cqh_#fff] ${size}`}>{ children }</span>
			</div>
		</div>
	</div>)
};

export const ChuniLampSuccessBadge = ({ success, className }: { className?: string, success: number }) => {
	const text = CHUNI_LAMPS.get(success)?.toUpperCase();
	const fontSize = text?.length! > 5 ? text?.length! > 10 ? 'xs' : 'sm' : 'md';
	return (<ChuniScoreBadge variant={getVariantFromLamp(success)} className={`${className ?? ''} ${fontSize === 'md' ? 'tracking-[0.1cqw]' : 'tracking-[0.025cqw]'}`} fontSize={fontSize}>
		{text}
	</ChuniScoreBadge>)
}

export const ChuniLampComboBadge = ({ className, isFullCombo, isAllJustice }: { className?: string, isFullCombo: number | null, isAllJustice: number | null }) => {
	if (!isFullCombo && !isAllJustice) return null;
	return (<ChuniScoreBadge variant={isAllJustice ? 'platinum' : 'gold'} className={className} fontSize="sm">
		{isAllJustice ? 'ALL JUSTICE' : 'FULL COMBO'}
	</ChuniScoreBadge>)
}
