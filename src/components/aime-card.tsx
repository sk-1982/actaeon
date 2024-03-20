'use client';

import { DB } from '@/types/db';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Button, Tooltip } from '@nextui-org/react';
import { useUser } from '@/helpers/use-user';
import { TbHammer, TbHammerOff, TbLock, TbLockOpen } from 'react-icons/tb';
import { hasPermission } from '@/helpers/permissions';
import { UserPermissions } from '@/types/permissions';
import { banUnbanCard, lockUnlockCard } from '@/actions/card';

type AimeCardProps = {
	card: DB['aime_card'],
	className?: string,
};

export const AimeCard = ({ className, card }: AimeCardProps) => {
	const [showCode, setShowCode] = useState(false);
	const user = useUser();
	const canBan = hasPermission(user?.permissions, UserPermissions.USERMOD);
	const [locked, setLocked] = useState(!!card.is_locked ?? false);
	const [banned, setBanned] = useState(!!card.is_banned ?? true);
	const formatOptions = {
		year: '2-digit',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	} as const;

	return (<div
		className={`${className ?? ''} relative flex flex-col max-w-md aspect-[3.37/2.125] rounded-2xl shadow bg-gradient-to-tr from-pink-700 to-rose-600 text-white p-4 gap-4 transition-all ${locked || banned ? 'brightness-50' : ''} ${banned ? 'grayscale' : ''}`}>
		<div className="flex gap-1">
			<div className="mr-auto mt-0.5 text-sm sm:text-medium">
				Registered {card.created_date?.toLocaleTimeString(undefined, formatOptions)}
			</div>

			{canBan && <Tooltip content={banned ? 'Unban card' : 'Ban card'} size="sm">
				<Button isIconOnly variant="light" onPress={() => {
					setBanned(!banned);
					banUnbanCard({ cardId: card.id, userId: card.user, isBan: !banned })
				}}>
					{banned ? <TbHammerOff className="w-7 h-7 text-white" /> : <TbHammer className="w-7 h-7 text-white" />}
				</Button>
			</Tooltip>}

			{!canBan && banned && <Tooltip content="This card is banned" size="sm">
				<Button isIconOnly variant="light" disabled>
					<TbHammer className="w-7 h-7 text-white" />
				</Button>
			</Tooltip>}

			<Tooltip content={locked ? 'Unlock card' : 'Lock card'} size="sm">
				<Button isIconOnly variant="light" onPress={() => {
					setLocked(!locked);
					lockUnlockCard({ cardId: card.id, userId: card.user, isLock: !locked });
				}}>
					{locked ? <TbLock className="w-7 h-7 text-white" /> : <TbLockOpen className="w-7 h-7 text-white" />}
				</Button>
			</Tooltip>
		</div>

		<div className={`[font-feature-settings:"fwid"] text-xs sm:text-medium font-semibold flex my-auto pb-4 sm:pb-0 gap-1 sm:gap-0 flex-wrap`}>
			{showCode ? <>
					{card.access_code?.match(/.{4}/g)?.join('-')}
					<EyeSlashIcon className="h-6 cursor-pointer ml-auto" onClick={() => setShowCode(false)} />
				</> :
				<>
					{('****-'.repeat(4) + card.access_code?.slice(-4))}
					<EyeIcon className="h-6 cursor-pointer ml-auto" onClick={() => setShowCode(true)} />
				</>}
		</div>

		<div className="text-sm sm:text-medium">
			Last Used {card.last_login_date?.toLocaleTimeString(undefined, formatOptions)}
		</div>

		{(locked || banned) && <div className="absolute flex items-center justify-center w-full left-0 top-[60%] backdrop-blur h-12 sm:h-16 bg-gray-600/50 font-bold sm:text-2xl">
			{locked ? 'Locked' : 'Banned'}
		</div>}
	</div>);
};
