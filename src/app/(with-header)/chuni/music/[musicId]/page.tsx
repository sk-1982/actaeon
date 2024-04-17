import { getMusic } from '@/actions/chuni/music';
import { notFound } from 'next/navigation';
import { getPlaylog } from '@/actions/chuni/playlog';

import { ChuniMusicDetail } from './music-detail';
import { getUserRating } from '@/actions/chuni/profile';
import { requireUser } from '@/actions/auth';

export default async function ChuniMusicDetailPage({ params }: { params: { musicId: string } }) {
	const musicId = parseInt(params.musicId);
	if (Number.isNaN(musicId))
		return notFound();

	const [music, playlog, rating] = await Promise.all([
		getMusic(musicId).then(d => structuredClone(d)),
		getPlaylog({ musicId, limit: 500 }),
		getUserRating(await requireUser()).then(d => structuredClone(d))
	]);

	if (!music.length)
		return notFound();

	return (<ChuniMusicDetail music={music} playlog={playlog} rating={rating} />)
}
