export const CHUNI_SCORE_RANKS = ['D', 'C', 'B', 'BB', 'BBB', 'A', 'AA', 'AAA', 'S', 'S+', 'SS', 'SS+', 'SSS', 'SSS+'];
export const CHUNI_SCORE_THRESHOLDS = [0, 500000, 600000, 700000, 800000, 900000, 925000, 950000, 975000, 990000, 1000000, 1005000, 1007500, 1009000];


export const getRankFromScore = (score: number) => {
	for (let i = CHUNI_SCORE_THRESHOLDS.length - 1; i >= 0; --i)
		if (score >= CHUNI_SCORE_THRESHOLDS[i])
			return i;
	return 0;
};
