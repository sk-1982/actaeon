import { getMusic } from '@/actions/chuni/music';
import { ChuniMusicList } from './music-list';


export default async function ChuniMusicPage() {
	const music = await getMusic();

	return (
		<ChuniMusicList music={structuredClone(music)} />
	);
}
