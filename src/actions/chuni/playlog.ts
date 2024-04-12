'use server';

import { requireUser } from '@/actions/auth';
import { PlaylogFilterState } from '@/app/(with-header)/chuni/playlog/page';
import { db } from '@/db';
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music';
import { chuniRating } from '@/helpers/chuni/rating';
import { sql } from 'kysely';

const SORT_KEYS = {
	Date: 'id',
	Rating: 'rating',
	Level: 'level',
	Score: 'score'
} as const;

const SORT_KEYS_SET = new Set(Object.keys(SORT_KEYS));

export type GetPlaylogOptions = {
	limit: number,
	offset?: number,
	sort?: keyof typeof SORT_KEYS,
	ascending?: boolean,
	search?: string
} & ({} |
	{ musicId: number } |
	{ musicId: number, chartId: number }) &
	Partial<PlaylogFilterState>;
export async function getPlaylog(opts: GetPlaylogOptions) {
	const user = await requireUser();
	const musicId = 'musicId' in opts ? +opts.musicId : NaN;
	const chartId = 'chartId' in opts ? +opts.chartId : NaN;

	const builder = db.with('p', db => db
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
		.where(({ and, eb, or, fn }) => and([
			...(!Number.isNaN(musicId) ? [eb('p.songId', '=', musicId)] : []),
			...(!Number.isNaN(chartId) ? [eb('p.chartId', '=', chartId)] : []),
			...(opts.difficulty?.size ? [eb('p.chartId', 'in', [...opts.difficulty].map(x => +x))] : []),
			...(opts.genre?.size ? [eb('p.genre', 'in', [...opts.genre])] : []),
			...(opts.lamp?.has('clear') ? [eb('p.isClear', '=', 1)] : []),
			...((opts.lamp?.has('aj') && opts.lamp?.has('fc')) ? [or([
					eb('p.isAllJustice', '=', 1),
					eb('p.isFullCombo', '=', 1)
				])] : // all justice and full combo selected, return either
				[]),
			...((opts.lamp?.has('aj') && !opts.lamp?.has('fc')) ? [eb('p.isAllJustice', '=', 1)] : []),  // return only all justice
			...((!opts.lamp?.has('aj') && opts.lamp?.has('fc')) ? [
				eb('p.isAllJustice', '=', 0),
				eb('p.isFullCombo', '=', 1)
			] : []),  // return only full combo
			...(opts.worldsEndTag?.size ? [or([
				eb('p.worldsEndTag', 'is', null),
				eb('p.worldsEndTag', 'in', [...opts.worldsEndTag])
			])] : []),
			...(opts.score?.size ? [eb('p.rank', 'in', [...opts.score].map(x => +x))] : []),
			...(opts.worldsEndStars ? [or([
				eb('p.worldsEndTag', 'is', null),
				and([
					eb('p.level', '>=', opts.worldsEndStars[0] * 2 - 1),
					eb('p.level', '<=', opts.worldsEndStars[1] * 2 - 1),
				])
			])] : []),
			...(opts.level ? [or([
				eb('p.worldsEndTag', 'is not', null),
				and([
					eb('p.level', '>=', opts.level[0]),
					eb('p.level', '<=', opts.level[1])
				])
			])] : []),
			...(opts.rating ? [or([
				eb('p.worldsEndTag', 'is not', null),
				and([
					eb('p.rating', '>=', opts.rating[0] as any),
					eb('p.rating', '<=', opts.rating[1] as any)
				])
			])] : []),
			...(opts.search?.length ? [or([
				eb(fn('lower', ['p.artist']), 'like', `%${opts.search.toLowerCase()}%`),
				eb(fn('lower', ['p.title']), 'like', `%${opts.search.toLowerCase()}%`)
			])] : []),
			...(opts.dateRange?.from ? [
				eb('sortNumber', '>=', opts.dateRange.from.valueOf() / 1000)
			] : []),
			...(opts.dateRange?.to ? [
				eb('sortNumber', '<=', opts.dateRange.to.valueOf() / 1000)
			] : [])
		]))
		.orderBy(SORT_KEYS_SET.has(opts.sort!) ? `${SORT_KEYS[opts.sort as keyof typeof SORT_KEYS]} ${opts.ascending ? 'asc' : 'desc'}` :
			'p.id desc');

	const playlog = await builder
		.selectAll()
		.offset(opts.offset && !Number.isNaN(opts.offset) ? +opts.offset : 0)
		.limit(Number.isNaN(opts.limit) ? 100 : opts.limit)
		.execute();

	let total = 0;
	if (playlog.length)
		total = Number((await builder
			.select(({ fn }) => fn.countAll().as('total'))
			.executeTakeFirstOrThrow()).total);

	return { data: structuredClone(playlog), total };
}

export type ChuniPlaylog = Awaited<ReturnType<typeof getPlaylog>>;
