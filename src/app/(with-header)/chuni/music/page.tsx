import { getMusic } from '@/actions/chuni/music';
import { ChuniMusicList } from '@/components/chuni/music-list';


export default async function ChuniMusicPage() {
	const music = await getMusic();

	return (
		<ChuniMusicList music={music} />
	);
}
