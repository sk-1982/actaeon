import { CHUNI_SCORE_RANKS } from '@/helpers/chuni/score-ranks';

export const CHUNI_VOICE_LINES: readonly [string, string][] = [
	['𝅘𝅥𝅮 SEGA 𝅘𝅥𝅮', '0035'],
	['CHUNITHM', '0036'],
	['Welcome to CHUNITHM', '0041'],
	['Full Combo', '0001'],
	['All Justice', '0002'],
	['Full Chain', '0008'],
	['New Record', '0009'],
	['All Clear', '0010'],
	['Genkai Toppa', '0046'],
	['Quest Clear', '0047'],
	['Continue?', '0050'],
	['Continue!', '0051'],
	['See You Next Play', '0052'],
	...CHUNI_SCORE_RANKS
		.map((rank, i) => [
			`Rank ${rank}`,
			(i + 100).toString().padStart(4, '0')
		] as [string, string])
		.reverse()
];
