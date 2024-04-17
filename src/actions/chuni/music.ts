'use server';

import { getUser, requireUser } from '@/actions/auth';
import { db } from '@/db';
import { sqlChuniRating } from '@/helpers/chuni/rating';
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music';
import { UserPayload } from '@/types/user';
import { revalidatePath } from 'next/cache';

export const getMusic = async (musicId?: number) => {
	const user = await getUser();

	return await db.selectFrom('chuni_static_music as music')
		.leftJoin('chuni_score_best as score', join =>
			join.onRef('music.songId', '=', 'score.musicId')
				.onRef('music.chartId', '=', 'score.level')
				.on('score.user', '=', user?.id!)
		)
		.leftJoin('chuni_item_favorite as favorite', join =>
			join.onRef('music.songId', '=', 'favorite.favId')
				.onRef('music.version', '=', 'favorite.version')
				.on('favorite.favKind',  '=', 1)
				.on('favorite.user', '=', user?.id!)
		)
		.innerJoin('actaeon_chuni_static_music_ext as musicExt', join => 
			join.onRef('music.songId', '=', 'musicExt.songId')
				.onRef('music.chartId', '=', 'musicExt.chartId'))
		.select(({ fn }) => [...CHUNI_MUSIC_PROPERTIES,
			'score.isFullCombo', 'score.isAllJustice', 'score.isSuccess', 'score.scoreRank', 'score.scoreMax',
			'score.maxComboCount',
			fn<boolean>('NOT ISNULL', ['favorite.favId']).as('favorite'),
			sqlChuniRating()] as const)
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

export type ChuniMusic = Awaited<ReturnType<typeof getMusic>>[number];

const getMusicById = async (user: UserPayload, musicId: number) => {
	if (isNaN(musicId))
		return { error: true, message: 'Invalid music ID.' };

	const music = await db.selectFrom('chuni_static_music as music')
		.select('music.version')
		.where(({ selectFrom, eb }) => eb('music.version', '=', selectFrom('chuni_static_music')
			.select(({ fn }) => fn.max('version').as('latest'))))
		.executeTakeFirst();

	if (!music)
		return { error: true, message: `Unknown music ID ${musicId}.` };

	return { error: false, music };
}

export const addFavoriteMusic = async (musicId: number) => {
	const user = await requireUser();
	const data = await getMusicById(user, musicId);
	if (data.error) return data;

	const existingFavorite = await db.selectFrom('chuni_item_favorite')
		.where(({ eb, and }) => and([
			eb('version', '=', data.music?.version!),
			eb('user', '=', user.id),
			eb('favId', '=', musicId),
			eb('favKind', '=', 1)
		]))
		.select('favId')
		.executeTakeFirst();

	if (existingFavorite) return;

	await db.insertInto('chuni_item_favorite')
		.values({
			version: data.music?.version!,
			user: user.id,
			favId: musicId,
			favKind: 1
		})
		.executeTakeFirst();
	
	revalidatePath('/chuni/music', 'page');
	revalidatePath(`/chuni/music/${musicId}`, 'page');
};

export const removeFavoriteMusic = async (musicId: number) => {
	const user = await requireUser();
	const data = await getMusicById(user, musicId);
	if (data.error) return data;

	await db.deleteFrom('chuni_item_favorite')
		.where(({ eb, and }) => and([
			eb('version', '=', data.music?.version!),
			eb('user', '=', user.id),
			eb('favId', '=', musicId),
			eb('favKind', '=', 1)
		]))
		.executeTakeFirst();
	
	revalidatePath('/chuni/music', 'page');
	revalidatePath(`/chuni/music/${musicId}`, 'page');
}
