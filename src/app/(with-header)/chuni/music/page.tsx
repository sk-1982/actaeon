import { getMusic } from '@/actions/chuni/music';
import { ChuniMusicList } from './music-list';
import { getUser } from '@/actions/auth';
import { getUserRating } from '@/actions/chuni/profile';


export default async function ChuniMusicPage() {
	const [music, rating] = await Promise.all([
		getMusic(),
		getUser().then(async u => {
			if (u) return structuredClone(await getUserRating(u));
		})
	]);

	return (
		<ChuniMusicList music={structuredClone(music)} topRating={rating} />
	);
}
