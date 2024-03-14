import { getMusic } from '@/actions/chuni/music';
import { notFound } from 'next/navigation';
import { MusicPlayer } from '@/components/music-player';
import { getJacketUrl, getMusicUrl } from '@/helpers/assets';
import { Ticker } from '@/components/ticker';
import { getPlaylog } from '@/actions/chuni/playlog';
import { Accordion, AccordionItem } from '@nextui-org/react';
import { ChuniMusicPlaylog } from '@/components/chuni/music-playlog';

export default async function ChuniMusicDetail({ params }: { params: { musicId: string } }) {
	const musicId = parseInt(params.musicId);
	if (Number.isNaN(musicId))
		return notFound();

	const [music, playlog] = await Promise.all([
		getMusic(musicId),
		getPlaylog({ musicId, limit: 500 })
	]);


	if (!music.length)
		return notFound();


	const cueId = music[0].jacketPath?.match(/UI_Jacket_(\d+)/)?.[1];

	return (<div className="flex flex-col items-center sm:mt-2">
		<MusicPlayer className="xl:self-start xl:mt-3 xl:ml-3 mb-3 sm:mb-6" image={getJacketUrl(`chuni/jacket/${music[0].jacketPath}`)}
			audio={getMusicUrl(`chuni/music/music${cueId?.padStart(4, '0')}`)}>
			<Ticker className="font-semibold text-center sm:text-left">{ music[0].title }</Ticker>
			<Ticker className="text-center sm:text-left">{ music[0].artist }</Ticker>
			<span className="text-medium">{ music[0].genre }</span>
		</MusicPlayer>
		<ChuniMusicPlaylog music={music} playlog={playlog} />
	</div>);
}
