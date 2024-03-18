'use client';

import { ChuniUserData, getUserData } from '@/actions/chuni/profile';
import { UserboxItems } from '@/actions/chuni/userbox';
import { ChuniNameplate } from '@/components/chuni/nameplate';
import { avatar, Button, ButtonGroup, Checkbox, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Select, SelectItem, user } from '@nextui-org/react';
import { SelectModalButton } from '@/components/select-modal';
import { ChuniTrophy } from '@/components/chuni/trophy';
import { getAudioUrl, getImageUrl } from '@/helpers/assets';
import { useEffect, useRef, useState } from 'react';
import { ChuniAvatar } from '@/components/chuni/avatar';
import { CHUNI_VOICE_LINES } from '@/helpers/chuni/voice';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { SaveIcon } from '@/components/save-icon';
import { useAudio } from '@/helpers/use-audio';
import { useIsMounted } from 'usehooks-ts';

export type ChuniUserboxProps = {
	profile: ChuniUserData,
	userboxItems: UserboxItems
};

const ITEM_KEYS: Record<keyof UserboxItems, keyof NonNullable<ChuniUserData>> = {
	namePlate: 'nameplateId',
	trophy: 'trophyId',
	mapIcon: 'mapIconId',
	systemVoice: 'voiceId',
	avatarWear: 'avatarWear',
	avatarHead: 'avatarHead',
	avatarFace: 'avatarFace',
	avatarSkin: 'avatarSkin',
	avatarItem: 'avatarItem',
	avatarFront: 'avatarFront',
	avatarBack: 'avatarBack'
};

const AVATAR_KEYS = ['avatarWear', 'avatarHead', 'avatarFace', 'avatarSkin', 'avatarItem', 'avatarFront', 'avatarBack'] as const;

type RequiredUserbox = NonNullable<UserboxItems>;
type EquippedItem = { [K in keyof RequiredUserbox]: RequiredUserbox[K][number] };
type SavedItem = { [K in keyof RequiredUserbox]: boolean };

export const ChuniUserbox = ({ profile, userboxItems }: ChuniUserboxProps) => {
	const initialEquipped = useRef(Object.fromEntries(Object.entries(ITEM_KEYS)
		.map(([key, profileKey]) => [key, userboxItems[key as keyof RequiredUserbox]
			.find(i => ('id' in i ? i.id : i.avatarAccessoryId) === profile?.[profileKey])])) as EquippedItem);
	const [equipped, setEquipped] = useState<EquippedItem>(initialEquipped.current);
	const [saved, setSaved] = useState<SavedItem>(Object.fromEntries(Object.keys(ITEM_KEYS).map(k => [k, true])) as any);
	const [playingVoice, setPlayingVoice] = useState(false);
	const [selectedLine, setSelectedLine] = useState(new Set(['0035']));
	const [playPreviews, _setPlayPreviews] = useState(true);
	const [selectingVoice, setSelectingVoice] = useState<EquippedItem['systemVoice'] | null>(null);

	const setPlayPreviews = (play: boolean) => {
		_setPlayPreviews(play);
		localStorage.setItem('chuni-userbox-play-previews', play ? '1' : '');
	}

	useEffect(() => {
		_setPlayPreviews(!!(localStorage.getItem('chuni-userbox-play-previews') ?? 1));
	}, []);

	const equipItem = <K extends keyof RequiredUserbox>(k: K, item: RequiredUserbox[K][number] | undefined | null) => {
		if (!item || equipped[k] === item) return;

		setEquipped(e => ({ ...e, [k]: item }));
		setSaved(s => ({ ...s, [k]: false }));
	};

	const reset = <K extends keyof RequiredUserbox>(...items: K[]) => {
		setSaved(s => ({ ...s, ...Object.fromEntries(items.map(i => [i, true])) }));
		setEquipped(e => ({ ...e, ...Object.fromEntries(Object
				.entries(initialEquipped.current).filter(([k]) => items.includes(k as any))) }))
	};

	const audioRef = useAudio({
		play: () => setPlayingVoice(true),
		ended: () => setPlayingVoice(false),
		pause: () => setPlayingVoice(false)
	}, audio => audio.volume = 0.25);

	const play = (src: string) => {
		if (!audioRef.current || !playPreviews) return;
		audioRef.current.pause();
		audioRef.current.src = src;
		audioRef.current.currentTime = 0;
		audioRef.current.play();
	};

	const stop = () => audioRef.current?.pause();

	const voicePreview = (<div className="flex rounded-xl overflow-hidden flex-grow">
		<Select label="Preview Voice Line" size="sm" radius="none" className="overflow-hidden min-w-56"
			isDisabled={!playPreviews}
			selectedKeys={selectedLine} onSelectionChange={s => {
			if (typeof s === 'string' || !s.size) return;
			setSelectedLine(s as any);
			play(getAudioUrl(`chuni/system-voice/${selectingVoice?.cuePath ?? equipped.systemVoice.cuePath}_${[...s][0]}`))
		}}>
			{CHUNI_VOICE_LINES.map(([line, id]) => <SelectItem key={id}>{line}</SelectItem>)}
		</Select>
		<Button isIconOnly color="primary" className="p-1.5 h-full" radius="none" size="lg" isDisabled={!playPreviews}
			onPress={() => playingVoice ? stop() :
			play(getAudioUrl(`chuni/system-voice/${selectingVoice?.cuePath ?? equipped.systemVoice.cuePath}_${[...selectedLine][0]}`))}>
			{playingVoice ? <StopIcon /> : <PlayIcon />}
		</Button>
	</div>);

	const renderItem = (item: { name: string | undefined | null }, image: string, textClass='', containerClass='') => (
		<div className={`w-full h-full flex flex-col border border-gray-500 rounded-2xl shadow-inner ${containerClass}`}>
			<img alt={item.name ?? ''} className={`w-full ${textClass}`} src={image} />
			<div className={textClass}>{ item.name }</div>
		</div>
	);

	return (<div className="flex justify-center w-full">
		<div className="grid grid-cols-12 justify-items-center max-w-[50rem] xl:max-w-[100rem] gap-2 flex-grow relative">

			{/* begin nameplate and trophy */}
			<div className="flex items-center justify-center w-full col-span-full xl:col-span-7">
				<div className="flex flex-col items-center h-full w-full xl:max-w-none py-2 sm:p-4 sm:bg-content2 rounded-lg sm:shadow-inner">
					<div className="text-2xl font-semibold mb-4 mr-auto px-2 flex w-full h-10">
						Profile
						{(!saved.namePlate || !saved.trophy) && <>
	              <Button className="ml-auto" color="danger" variant="light" onPress={() => reset('namePlate', 'trophy')}>
	                  Reset
	              </Button>
	              <Button className="ml-2" color="primary">Save</Button>
	          </>}
					</div>
					<div className="w-full max-w-full">
						<ChuniNameplate profile={profile ? {
							...profile,
							nameplateName: equipped.namePlate.name,
							nameplateImage: equipped.namePlate.imagePath,
							trophyName: equipped.trophy.name,
							trophyRareType: equipped.trophy.rareType
						} : null} className="w-full" />
					</div>
					<div className="flex gap-2 w-full px-2 sm:px-1">
						<SelectModalButton className="flex-grow flex-1" displayMode="grid" modalSize="full" rowSize={230} colSize={500} gap={6} items={userboxItems.namePlate}
							modalId="nameplate"
							renderItem={n => renderItem(n, getImageUrl(`chuni/name-plate/${n.imagePath}`), 'w-full sm:text-lg', 'px-2 pb-1')}
							selectedItem={equipped.namePlate} onSelected={i => equipItem('namePlate', i)}>
							Change Nameplate
						</SelectModalButton>
						<SelectModalButton className="flex-grow flex-1" displayMode="list" modalSize="2xl" rowSize={66} items={userboxItems.trophy}
							modalId="trophy"
							renderItem={n => <ChuniTrophy rarity={n.rareType} name={n.name} />}
							selectedItem={equipped.trophy} onSelected={i => equipItem('trophy', i)}>
							Change Trophy
						</SelectModalButton>
					</div>
				</div>
			</div>
			{/* end nameplate and trophy */}

			<Divider className="sm:hidden mt-2 col-span-full" />

			{/* begin avatar */}
			<div className="col-span-full xl:col-span-5 flex flex-col w-full py-2 sm:pl-3 sm:pr-6 rounded-lg sm:shadow-inner sm:bg-content2">
				<div className="text-2xl font-semibold px-2 mt-2 -mb-3 flex h-12">
					Avatar
					{AVATAR_KEYS.some(k => !saved[k]) && <>
	            <Button className="ml-auto" color="danger" variant="light" onPress={() => reset(...AVATAR_KEYS)}>
	                Reset
	            </Button>
	            <Button className="ml-2" color="primary">Save</Button>
	        </>}
				</div>
				<div className="flex flex-col sm:flex-row h-full w-full items-center ">
					<div className="w-full max-w-96">
						<ChuniAvatar className="w-full sm:w-auto sm:h-96"
							wear={equipped.avatarWear.texturePath}
							head={equipped.avatarHead.texturePath}
							face={equipped.avatarFace.texturePath}
							skin={equipped.avatarSkin.texturePath}
							item={equipped.avatarItem.texturePath}
							back={equipped.avatarBack.texturePath}/>
					</div>
					<div className="grid grid-cols-2 w-full px-2 sm:px-0 sm:flex flex-col gap-1.5 sm:ml-3 flex-grow">
						{(['avatarHead', 'avatarFace', 'avatarWear', 'avatarSkin', 'avatarItem', 'avatarBack'] as const).map(k => ((k !== 'avatarSkin' || userboxItems.avatarSkin.length > 1) && <SelectModalButton
	              key={k} displayMode="grid" modalSize="3xl" colSize={175} rowSize={205} gap={5} modalId={k}
								className={(k === 'avatarBack' && userboxItems.avatarSkin.length === 1) ? 'w-full col-span-full' : 'w-full'}
	              onSelected={i => equipItem(k, i)} items={userboxItems[k]} selectedItem={equipped[k]}
	              renderItem={i => renderItem(i, getImageUrl(`chuni/avatar/${i.iconPath}`)) }>
	              Change {k.slice(6)}
	          </SelectModalButton>))}
					</div>
				</div>
			</div>
			{/* end avatar */}

			<Divider className="sm:hidden mt-2 col-span-full" />

			{/* begin system voice */}
			<div className="flex flex-col p-4 w-full col-span-full xl:col-span-6 sm:bg-content2 rounded-lg sm:shadow-inner items-center">
				<div className="text-2xl font-semibold mb-4 px-2 flex w-full h-10">
					Voice

					{!saved.systemVoice && <>
              <Button className="ml-auto" color="danger" variant="light" onPress={() => reset('systemVoice')}>
                  Reset
              </Button>
              <Button className="ml-2" color="primary">Save</Button>
          </>}
				</div>

				<div className="flex w-full flex-col sm:flex-row items-center">
					<div className="flex flex-col">
						<img className="w-80 max-w-full"
							alt={equipped.systemVoice.name ?? ''} src={getImageUrl(`chuni/system-voice-icon/${equipped.systemVoice.imagePath}`)} />
						<span className="text-center">{ equipped.systemVoice.name }</span>
					</div>

					<div className="flex flex-col flex-grow w-full mt-3 sm:-mt-5 sm:w-auto gap-2">
						<Checkbox isSelected={playPreviews} onValueChange={setPlayPreviews} size="lg" className="text-nowrap">
							<span className="text-sm">Enable Previews</span>
						</Checkbox>
						{ voicePreview }
						<SelectModalButton selectedItem={equipped.systemVoice} items={userboxItems.systemVoice}
							displayMode="grid" rowSize={150} colSize={175} gap={6} modalSize="full"
							modalId="system-voice"
							footer={<><div className="flex flex-grow gap-2 items-center max-w-full sm:max-w-[min(100%,18rem)]">
								{ voicePreview }
							</div>
								<Checkbox isSelected={playPreviews} onValueChange={setPlayPreviews} size="lg" className="text-nowrap mr-auto">
									<span className="text-sm">Enable Previews</span>
								</Checkbox>
							</>}
							onSelected={i => {
								setSelectingVoice(i ?? null);
								stop();
								if (i) equipItem('systemVoice', i);
							}}
							onSelectionChanged={i => {
								play(getAudioUrl(`chuni/system-voice/${i.cuePath}_${[...selectedLine][0]}`));
								setSelectingVoice(i);
							}}
							renderItem={i => renderItem(i, getImageUrl(`chuni/system-voice-icon/${i.imagePath}`))}>
							Change Voice
						</SelectModalButton>
					</div>
				</div>
			</div>
			{/*	end system voice */}

			<Divider className="sm:hidden mt-2 col-span-full" />

			{/*	begin map icon*/}
			<div className="flex flex-col p-4 w-full col-span-full xl:col-span-6 sm:bg-content2 rounded-lg sm:shadow-inner items-center">
				<div className="text-2xl font-semibold mb-4 px-2 flex w-full h-10">
					Map Icon

					{!saved.mapIcon && <>
              <Button className="ml-auto" color="danger" variant="light" onPress={() => reset('mapIcon')}>
                  Reset
              </Button>
              <Button className="ml-2" color="primary">Save</Button>
          </>}
				</div>

				<img className="w-52 max-w-full -mt-4 sm:-mt-12"
					alt={equipped.mapIcon.name ?? ''} src={getImageUrl(`chuni/map-icon/${equipped.mapIcon.imagePath}`)} />
				<span className="text-center mb-2">{ equipped.mapIcon.name }</span>
				<SelectModalButton onSelected={i => i && equipItem('mapIcon', i)} selectedItem={equipped.mapIcon}
					displayMode="grid" modalSize="full" rowSize={210} colSize={175} items={userboxItems.mapIcon} gap={6}
					className="w-full sm:w-auto" modalId="map-icon"
					renderItem={i => renderItem(i, getImageUrl(`chuni/map-icon/${i.imagePath}`))}>
					Change Map Icon
				</SelectModalButton>
			</div>
			{/* end map icon	*/}

			{Object.values(saved).some(x => !x) && <Button className="fixed bottom-3 right-3 hidden sm:flex" color="primary" radius="full" startContent={<SaveIcon className="h-6" />}>
				Save All
			</Button>}

			{Object.values(saved).some(x => !x) && <>
          <div className="block sm:hidden h-20" />
					<div className="flex sm:hidden fixed z-40 items-center font-semibold bottom-0 left-0 w-full p-3 bg-content1 gap-2 flex-wrap ">
	          You have unsaved changes

	          <Button className="ml-auto" color="primary">
	              Save All
	          </Button>
	      </div>
			</>}

		</div>

	</div>);
};
