import { sql } from 'kysely';
import { BigDecimal } from '../big-decimal';

export const sqlChuniRating = (score: any = sql.raw(`CAST(score.scoreMax AS INT)`),
                            level: any = sql.raw(`(CAST(music.level AS DECIMAL(3, 1)) * 100)`)) => sql<string>`
CAST(GREATEST((CASE
    WHEN ${score} IS NULL THEN NULL
    WHEN ${score} >= 1009000 THEN ${level} + 215
    WHEN ${score} >= 1007500 THEN ${level} + 200 + (${score} - 1007500) / 100
    WHEN ${score} >= 1005000 THEN ${level} + 150 + (${score} - 1005000) / 50
    WHEN ${score} >= 1000000 THEN ${level} + 100 + (${score} - 1000000) / 100
    WHEN ${score} >=  975000 THEN ${level} +       (${score} -  975000) / 250
    WHEN ${score} >=  900000 THEN ${level} - 500 + (${score} -  900000) / 150
    WHEN ${score} >=  800000 THEN (${level} - 500) / 2 + (${score} - 800000) * ((${level} - 500) / 2) / 100000
    WHEN ${score} >=  500000 THEN ((${level} - 500) / 2 * (${score} - 500000)) / 300000
    ELSE 0 END) / 100, 0) AS DECIMAL(10, 8))
`.as('rating');


export const chuniRating = (score: number, level: number | BigDecimal, decimals = 8n) => {
	level = new BigDecimal(level.toFixed(1)).mul(100);

	let rating: BigDecimal;
	if (score >= 1009000)
		rating = level.add(215);
	else if (score >= 1007500)
		rating = level.add(200).add(new BigDecimal(score - 1007500).div(100, decimals));
	else if (score >= 1005000)
		rating = level.add(150).add(new BigDecimal(score - 1005000).div(50, decimals));
	else if (score >= 1000000)
		rating = level.add(100).add(new BigDecimal(score - 1000000).div(100, decimals));
	else if (score >= 975000)
		rating = level.add(new BigDecimal(score - 975000).div(250, decimals));
	else if (score >= 900000)
		rating = level.sub(500).add(new BigDecimal(score - 900000).div(150, decimals));
	else if (score >= 800000)
		rating = level.sub(500).div(2, decimals).add(new BigDecimal(score - 800000).mul(level.sub(500).div(2, decimals)).div(100000, decimals));
	else if (score >= 500000)
		rating = level.sub(500).div(2).mul(score - 500000).div(300000);
	else
		rating = BigDecimal.ZERO;

	if (rating.val < 0n)
		rating = BigDecimal.ZERO;

	return rating.div(100, decimals);
};

export const chuniRatingInverse = (rating: number | string | BigDecimal, level: number | BigDecimal) => {
	const ratingDecimal = new BigDecimal(rating);
	rating = ratingDecimal.mul(100);
	if (rating.val === 0n) return 0;

	const levelDecimal = new BigDecimal(level.toFixed(1));
	level = levelDecimal.mul(100);
	
	const diff = rating.sub(level);
	const compare = diff.compare(215);
	
	if (compare > 0)
		return Infinity;
	if (compare === 0)
		return 1009000;

	let val: number;
	
	if (diff.compare(200) >= 0)
		val = diff.add(9875).mul(100).valueOf();
	else if (diff.compare(150) >= 0)
		val = diff.add(19950).mul(50).valueOf();
	else if (diff.compare(100) >= 0)
		val = diff.add(9900).mul(100).valueOf();
	else if (diff.compare(0) >= 0)
		val = diff.add(3900).mul(250).valueOf();
	else if (diff.compare(-500) >= 0)
		val = diff.add(6500).mul(150).valueOf();
	// between BBB and A [800000, 900000)
	else if (ratingDecimal.compare(chuniRating(800000, levelDecimal, ratingDecimal.decimals)) >= 0)
		val = level.mul(7).add(rating.mul(2)).sub(3500).mul(100000)
			.div(level.sub(500), 1n).valueOf();
	else
		val = level.mul(5).add(rating.mul(6)).sub(2500).mul(100000)
			.div(level.sub(500), 1n).valueOf();
	
	return Math.ceil(val);
};
