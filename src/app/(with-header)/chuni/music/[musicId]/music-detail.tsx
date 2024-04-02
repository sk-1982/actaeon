'use client';

import { addFavoriteMusic, ChuniMusic, removeFavoriteMusic } from '@/actions/chuni/music';
import { ChuniPlaylog } from '@/actions/chuni/playlog';
import { MusicPlayer } from '@/components/music-player';
import { getJacketUrl, getMusicUrl } from '@/helpers/assets';
import { Ticker } from '@/components/ticker';
import { ChuniMusicPlaylog } from './music-playlog';
import { Button } from '@nextui-org/react';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useErrorModal } from '@/components/error-modal';
import { useUser } from '@/helpers/use-user';

type ChuniMusicDetailProps = {
	music: ChuniMusic[],
	playlog: ChuniPlaylog
};

export const ChuniMusicDetail = ({ music, playlog }: ChuniMusicDetailProps) => {
	const cueId = music[0].jacketPath?.match(/UI_Jacket_(\d+)/)?.[1];
	const [favorite, setFavorite] = useState(music[0].favorite);
	const [pendingFavorite, setPendingFavorite] = useState(false);
	const setError = useErrorModal();
	const user = useUser();

	return (<div className="flex flex-col items-center sm:mt-2">
		<MusicPlayer className="xl:self-start xl:mt-3 xl:ml-3 mb-3 sm:mb-6" image={getJacketUrl(`chuni/jacket/${music[0].jacketPath}`)}
			audio={getMusicUrl(`chuni/music/music${cueId?.padStart(4, '0')}`)}>
			<Ticker className="font-semibold text-center sm:text-left">{ music[0].title }</Ticker>
			<Ticker className="text-center sm:text-left">{ music[0].artist }</Ticker>
			<span className="text-medium">{ music[0].genre }</span>
			{!!user?.chuni && <Button isIconOnly className={`absolute right-2 top-2 ${favorite ? 'text-red-500' : 'text-gray-500'}`} radius="full"
				variant="light" onPress={() => {
					if (pendingFavorite) return;
					setPendingFavorite(true);
					const f = favorite;
					setFavorite(!f);
					(f ? removeFavoriteMusic : addFavoriteMusic)(music[0].songId!)
						.then(res => {
							if (res?.error) {
								setFavorite(f);
								return setError(`Failed to set favorite: ${res.message}`);
							}
						}).finally(() => setPendingFavorite(false));
				}}>
				{favorite ? <SolidHeartIcon className="w-3/4" /> : <OutlineHeartIcon className="w-3/4" />}
			</Button>}
		</MusicPlayer>
		<ChuniMusicPlaylog music={music} playlog={playlog} />
	</div>);
};
