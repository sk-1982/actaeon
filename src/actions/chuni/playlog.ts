'use server';

import { requireUser } from '@/actions/auth';
import { db } from '@/db';
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music';
import { chuniRating } from '@/helpers/chuni/rating';
import { sql } from 'kysely';

export type GetPlaylogOptions = {
	limit: number
} & ({} |
	{ musicId: number } |
	{ musicId: number, chartId: number });

export async function getPlaylog(opts: GetPlaylogOptions) {
	const user = await requireUser();

	const playlog = await db.with('p', db => db
		.selectFrom('chuni_score_playlog as playlog')
		.innerJoin('chuni_static_music as music', join => join
			.onRef('music.songId', '=', 'playlog.musicId')
			.onRef('music.chartId', '=', 'playlog.level'))
		.where(({ and, eb, selectFrom }) => and([
			eb('playlog.user', '=', user.id),
			eb('music.version', '=', selectFrom('chuni_static_music')
				.select(({ fn }) => fn.max('version').as('latest'))),
		]))
		.select(
			({ ref }) => ['playlog.id', 'playlog.sortNumber', 'playlog.playDate', 'playlog.userPlayDate', 'playlog.track',
				'playlog.score', 'playlog.rank', 'playlog.maxCombo', 'playlog.maxChain', 'playlog.rateTap',
				'playlog.rateHold', 'playlog.rateSlide', 'playlog.rateAir', 'playlog.rateFlick', 'playlog.judgeGuilty',
				'playlog.judgeAttack', 'playlog.judgeCritical', 'playlog.judgeHeaven', 'playlog.playerRating',
				'playlog.isNewRecord', 'playlog.isFullCombo', 'playlog.fullChainKind', 'playlog.isAllJustice',
				'playlog.playKind', 'playlog.isClear', 'playlog.placeName',
				...CHUNI_MUSIC_PROPERTIES,
				chuniRating(ref('playlog.score')),
				sql<number>`(playlog.playerRating - (LEAD(playlog.playerRating) OVER (ORDER BY id DESC)))`
					.as('playerRatingChange')
			])
		.orderBy('playlog.id desc')
	)
		.selectFrom('p')
		.where(({ and, eb }) => and([
			...('musicId' in opts ? [eb('p.songId', '=', opts.musicId)] : []),
			...('chartId' in opts ? [eb('p.chartId', '=', opts.chartId)] : []),
		]))
		.selectAll()
		.limit(+opts.limit)
		.execute();

	let remaining = 0;
	if (playlog.length)
		remaining = Number((await db.selectFrom('chuni_score_playlog as playlog')
			.where(({ and, eb }) => and([
				eb('playlog.user', '=', user.id),
				eb('playlog.id', '<', playlog.at(-1)!.id),
				...('musicId' in opts ? [eb('playlog.musicId', '=', opts.musicId)] : []),
				...('chartId' in opts ? [eb('playlog.level', '=', opts.chartId)] : []),
			]))
			.select(({ fn }) => fn.countAll().as('remaining'))
			.executeTakeFirstOrThrow()).remaining);

	return { data: playlog, remaining };
}
