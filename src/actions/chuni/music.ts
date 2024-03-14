import { getUser } from '@/actions/auth';
import { db } from '@/db';
import { chuniRating } from '@/helpers/chuni/rating';
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music';

export const getMusic = async (musicId?: number) => {
	const user = await getUser();

	return await db.selectFrom('chuni_static_music as music')
		.leftJoin('chuni_score_best as score', join =>
			join.onRef('music.songId', '=', 'score.musicId')
				.onRef('music.chartId', '=', 'score.level')
				.on('score.user', '=', user?.id!)
		)
		.select([...CHUNI_MUSIC_PROPERTIES, 'score.isFullCombo', 'score.isAllJustice', 'score.isSuccess',
			'score.scoreRank', 'score.scoreMax', chuniRating()])
		.where(({ selectFrom, eb, and, or }) => and([
			eb('music.version', '=', selectFrom('chuni_static_music')
				.select(({ fn }) => fn.max('version').as('latest'))),
			eb('music.level', '!=', 0),
			or([
				eb('music.worldsEndTag', 'is', null),
				eb('music.worldsEndTag', '!=', 'Invalid')
			]),
			...(typeof musicId === 'number' ? [eb('music.songId', '=', musicId)] : [])
		]))
		.orderBy(['music.songId asc', 'music.chartId asc'])
		.execute();
};
