import { sql } from 'kysely';

import { db } from '@/db';
import { chuniRating } from '@/helpers/chuni/rating';
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music';
import { UserPayload } from '@/types/user';

type RecentRating = {
	scoreMax: string,
	musicId: string,
	level: string,
	romVersionCode: string
};

const avatarNames = ['avatarBack', 'avatarFace', 'avatarItem', 'avatarWear', 'avatarFront', 'avatarSkin',
	'avatarHead'] as const;

export async function getUserData(user: UserPayload) {
	const res = await db.selectFrom('chuni_profile_data as p')
		.leftJoin('actaeon_chuni_static_name_plate as nameplate', 'p.nameplateId', 'nameplate.id')
		.leftJoin('actaeon_chuni_static_trophies as trophy', 'p.trophyId', 'trophy.id')
		.leftJoin('actaeon_chuni_static_map_icon as mapicon', 'p.mapIconId', 'mapicon.id')
		.leftJoin('actaeon_chuni_static_system_voice as voice', 'p.voiceId', 'voice.id')
		.leftJoin('chuni_static_avatar as avatarBack', 'p.avatarBack', 'avatarBack.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarFace', 'p.avatarFace', 'avatarFace.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarItem', 'p.avatarItem', 'avatarItem.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarWear', 'p.avatarWear', 'avatarWear.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarFront', 'p.avatarFront', 'avatarFront.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarSkin', 'p.avatarSkin', 'avatarSkin.avatarAccessoryId')
		.leftJoin('chuni_static_avatar as avatarHead', 'p.avatarHead', 'avatarHead.avatarAccessoryId')
		.leftJoin('chuni_profile_team as team', 'p.teamId', 'team.id')
		.select(['p.exp', 'p.level', 'p.point', 'p.trophyId', 'p.userName', 'p.playCount', 'p.totalPoint', 'p.characterId',
			'p.friendCount', 'p.lastPlaceId', 'p.nameplateId', 'p.totalMapNum', 'p.lastClientId', 'p.lastPlayDate',
			'p.playerRating', 'p.totalHiScore', 'p.firstPlayDate', 'p.highestRating', 'p.multiWinCount', 'p.lastRomVersion',
			'p.multiPlayCount', 'p.lastDataVersion', 'p.reincarnationNum', 'p.totalBasicHighScore', 'p.totalExpertHighScore',
			'p.totalMasterHighScore', 'p.totalRepertoireCount', 'p.totalAdvancedHighScore', 'p.mapIconId', 'p.medal',
			'p.voiceId', 'p.teamId', 'p.eliteRankPoint', 'p.stockedGridCount', 'p.overPowerRate', 'p.battleRewardStatus',
			'p.charaIllustId', 'p.classEmblemMedal', 'p.overPowerPoint', 'p.totalUltimaHighScore', 'p.skillId',
			'p.avatarBack', 'p.avatarFace', 'p.avatarItem', 'p.avatarWear', 'p.avatarFront', 'p.avatarSkin', 'p.avatarHead',

			'nameplate.name as nameplateName', 'nameplate.imagePath as nameplateImage',
			'trophy.name as trophyName', 'trophy.rareType as trophyRareType',
			'mapicon.name as mapIconName', 'mapicon.imagePath as mapIconImage',
			'voice.name as voiceName', 'voice.imagePath as voiceImage', 'voice.cuePath as voiceCue',
			'team.teamName', 'team.teamPoint',

			...avatarNames.flatMap(name =>
				[`${name}.name as ${name}Name`, `${name}.iconPath as ${name}Icon`,
					`${name}.texturePath as ${name}Texture`] as const)
		])
		.where(({ and, eb, selectFrom }) => and([
			eb('p.user', '=', user.id),
			eb('p.version', '=',
				selectFrom('chuni_static_music')
					.select(({ fn }) => fn.max('version').as('latest'))
			),
			...avatarNames.map(name => eb(`${name}.version`, '=', selectFrom('chuni_static_music')
				.select(({ fn }) => fn.max('version').as('latest'))))
		]))
		.executeTakeFirst();

	return res;
}

export async function getUserRating(user: UserPayload) {
	const recent = await db.selectFrom('chuni_profile_recent_rating as recent')
		.where('user', '=', user.id)
		.innerJoin(
			sql<RecentRating>`JSON_TABLE(recent.recentRating, '$[*]' COLUMNS (
                    scoreMax VARCHAR(7) PATH '$.score',
                    musicId VARCHAR(4) PATH '$.musicId',
                    level VARCHAR(1) PATH '$.difficultId',
                    romVersionCode VARCHAR(32) PATH '$.romVersionCode'
                ))`.as('score'), join => join.onTrue())
		.innerJoin('chuni_static_music as music', join => join.onRef('score.musicId', '=', 'music.songId')
			.onRef('score.level', '=', 'music.chartId'))
		.select(({ lit }) => [...CHUNI_MUSIC_PROPERTIES, chuniRating(sql.raw(`CAST(score.scoreMax AS INT)`)),
			sql<string>`CAST(score.scoreMax AS INT)`.as('scoreMax'),
			lit<number>(1).as('pastIndex')
		])
		.where(({ selectFrom, eb }) => eb('music.version', '=', selectFrom('chuni_static_music')
			.select(({ fn }) => fn.max('version').as('latest'))))
		.execute();

	const top = await db.selectFrom('chuni_score_best as score')
		.innerJoin('chuni_static_music as music', join => join
			.onRef('music.songId', '=', 'score.musicId')
			.onRef('music.chartId', '=', 'score.level')
		)
		.where(({ eb, and, selectFrom }) => and([
			eb('user', '=', user.id),
			eb('score.level', '!=', 5),
			eb('music.version', '=', selectFrom('chuni_static_music')
				.select(({ fn }) => fn.max('version').as('latest')))
		]))
		.select([
			...CHUNI_MUSIC_PROPERTIES, 'score.scoreMax',
			chuniRating()
		])
		.orderBy('rating desc')
		.limit(30)
		.execute();

	recent.forEach((r, i) => r.pastIndex = i);
	recent.sort((a, b) => +b.rating - +a.rating);

	return { recent, top };
}
