import { getUserData } from '@/actions/chuni/profile';
import {  getImageUrl } from '@/helpers/assets';
import { ChuniTrophy } from '@/components/chuni/trophy';
import { PickNullable } from '@/types/pick-nullable';
import { ChuniRating } from '@/components/chuni/rating';
import { formatJst } from '@/helpers/format-jst';

export type Profile = PickNullable<Awaited<ReturnType<typeof getUserData>>,
	'trophyName' | 'trophyRareType' | 'nameplateImage' | 'nameplateName' | 'teamName' | 'characterId' | 'level' | 'userName' | 'overPowerRate' | 'overPowerPoint' | 'lastPlayDate' | 'playerRating' | 'highestRating'>;

export type ChuniNameplateProps = {
	className?: string,
	profile: Profile,
};

export const ChuniNameplate = ({ className, profile }: ChuniNameplateProps) => {
	if (!profile) return null;

	return (<div className={`aspect-[576/210] overflow-hidden ${className ?? ''}`}>
		<div className="aspect-[576/228] w-full relative">
			<div className="absolute z-10 w-[72%] h-[83%] right-[3.25%] top-[2.5%] flex flex-col items-center">
				<div className="h-[15%] w-[99%]">
					<div className="@container-size h-full bg-gray-400 rounded p-[0.35%]">
						<div className="w-full h-full border border-gray-600 rounded flex items-center shadow-inner">
							<div className="text-[50cqh] mx-2 text-gray-700 font-semibold">TEAM</div>
							<div className={`text-[55cqh] w-full h-full p-[0.5%] pl-0 ${profile.teamName ? 'font-semibold text-white' : 'italic text-gray-300'}`}>
								<div className="w-full h-full bg-gray-700 shadow-inner px-[2.5%] flex items-center">
									<span>{profile.teamName ?? 'You are not part of a team'}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<ChuniTrophy rarity={profile.trophyRareType} name={profile.trophyName} />
				<div className="w-[99%] h-[52%] flex">
					<div className="w-full m-[0.25%]">
						<div className="h-full w-full bg-gray-400 px-[2%] @container-size flex flex-col text-black font-semibold text-nowrap overflow-hidden">
							<div className="flex items-baseline border-b border-gray-700">
								<span className="font-normal text-[14cqh]">Lv.</span>
								<span className="text-[18cqh]">{profile.level}</span>
								<span lang="ja" className="text-[21cqh] flex-grow text-center font-bold">
								{profile.userName?.padEnd(7, '\u3000')}
							</span>
							</div>
							<div className="leading-none py-[1.25%] border-b border-gray-700 flex items-baseline">
								<span className="font-normal text-[13cqh]">Over Power:&nbsp;</span>
								<span className="text-[14cqh]">{profile.overPowerPoint?.toLocaleString()} ({((profile?.overPowerRate ?? 0)/ 100).toFixed(2)}%)</span>
							</div>
							<div className="leading-none py-[1%] border-b border-gray-700 flex items-baseline">
								<span className="font-normal text-[13cqh]">Last Play Date:&nbsp;</span>
								<span className="text-[15cqh]">{profile.lastPlayDate && formatJst(profile.lastPlayDate)}</span>
							</div>
							<div className="leading-none flex items-baseline">
								<ChuniRating className="text-[14cqh] text-stroke-[0.75cqh]" rating={profile.playerRating}>
									RATING:&nbsp;
								</ChuniRating>
								<ChuniRating className="text-[18cqh] text-stroke-[0.75cqh]" rating={profile.playerRating} />
								<span className="text-[13cqh]">&nbsp;(<span className="text-[11cqh]">MAX</span> {((profile.highestRating ?? 0) / 100).toFixed(2)})</span>
							</div>
						</div>
					</div>
					<img className="ml-auto aspect-square h-full bg-gray-200 border-2 border-black" alt="Character" src={profile.characterId !== null ? getImageUrl(
						`chuni/character/CHU_UI_Character_${Math.floor(profile.characterId / 10).toString()
							.padStart(4, '0')}_${(profile.characterId % 10).toString().padStart(2, '0')}_02`) : ''}/>
				</div>
			</div>
			<img src={getImageUrl(`chuni/name-plate/${profile.nameplateImage}`)} title={profile.nameplateName ?? 'Nameplate'}
				alt={profile.nameplateName ?? 'Nameplate'} className="absolute inset-0 w-full h-full" />
		</div>
	</div>)
};
