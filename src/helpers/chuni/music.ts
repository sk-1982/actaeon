import { sql } from 'kysely';

export const CHUNI_MUSIC_PROPERTIES = ['music.songId',
	'music.chartId',
	'music.title',
	'music.artist',
	'music.jacketPath',
	'music.worldsEndTag',
	'music.genre',
	'music.level'
	// sql<string>`CAST(music.level AS DECIMAL(3, 1))`.as('level')
] as const;
