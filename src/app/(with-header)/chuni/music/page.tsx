import { getMusic } from '@/actions/chuni/music';
import { SelectItem, Slider } from '@nextui-org/react';
import { FilterSorter } from '@/components/filter-sorter';
import { ChuniMusicList } from '@/components/chuni/music-list';


export default async function ChuniMusicPage() {
	const music = await getMusic();

	return (
		<ChuniMusicList music={music} />
	);
}
