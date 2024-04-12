import Image from 'next/image';
import { getImageUrl } from '@/helpers/assets';

const TROPHY_TYPES = {
	0: 0,  // common
	1: 1,  // bronze
	2: 2,  // silver
	3: 3,  // gold
	4: 3,  // expert all justice (gold)
	5: 4,  // platinum
	6: 4,  // master all justice (platinum)
	7: 5,  // rainbow
	9: 6,  // gekichumai dev staff
	10: 7, // ongeki linked title
	11: 8  // maimai linked title
};

const TROPHY_Y = [6, 81, 156, 231, 306, 381, 456, 531, 606].map(x => x / 1024 * 100);

export type ChuniTrophyProps = {
	name: string | null,
	rarity: number | null,
	className?: string
};

export const ChuniTrophy = ({ name, rarity, className }: ChuniTrophyProps) => {
	return (<div className={`w-full overflow-hidden relative aspect-[593/62] @container-size ${className}`}>
		<div className="z-10 absolute w-full h-full flex items-center justify-center top-0" lang="ja">
			<div className="w-11/12 pb-[2.5cqh] leading-loose text-black font-semibold text-center text-nowrap overflow-hidden text-[50cqh]" title={name ?? 'Trophy'}>
				{name}
			</div>
		</div>
		<div className="w-[129.51%] aspect-[768/1024] relative">
			<Image width={593} height={62} priority
				src={getImageUrl('chuni/trophy/CHU_UI_title_rank_00_v10')}
				alt={name ?? 'Trophy'} title={name ?? 'Trophy'}
				className="w-full absolute h-auto left-[-0.78125%]" style={{
					top: `-${TROPHY_Y[TROPHY_TYPES[rarity as keyof typeof TROPHY_TYPES]]}%`
			}}/>
		</div>
	</div>)
}
