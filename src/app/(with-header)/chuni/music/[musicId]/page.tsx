import { getMusic } from '@/actions/chuni/music';
import { notFound } from 'next/navigation';
import { getPlaylog } from '@/actions/chuni/playlog';

import { ChuniMusicDetail } from '@/components/chuni/music-detail';

export default async function ChuniMusicDetailPage({ params }: { params: { musicId: string } }) {
	const musicId = parseInt(params.musicId);
	if (Number.isNaN(musicId))
		return notFound();

	const [music, playlog] = await Promise.all([
		getMusic(musicId),
		getPlaylog({ musicId, limit: 500 })
	]);


	if (!music.length)
		return notFound();

	return (<ChuniMusicDetail music={music} playlog={playlog} />)
}
