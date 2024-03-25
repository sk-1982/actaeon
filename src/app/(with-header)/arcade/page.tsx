import { Arcade, getArcades } from '@/data/arcade';
import { getUser } from '@/actions/auth';
import { Divider, Tooltip } from '@nextui-org/react';
import { GlobeAltIcon, LinkIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Visibility } from '@/types/privacy-visibility';
import Link from 'next/link';
import { CreateArcadeButton } from '@/components/create-arcade-button';

const getLocation = (arcade: Arcade) => {
	let out = [arcade.city, arcade.state, arcade.country].filter(x => x).join(', ');
	if (arcade.timezone) out += ` (${arcade.timezone})`;

	return out;
};

export default async function ArcadePage() {
	const user = await getUser();
	const arcades = (await getArcades({ user })).filter(a => a.visible);

	return (<main className="flex flex-col max-w-5xl mx-auto w-full">
		<header className="font-semibold flex items-center text-2xl p-4">
			Arcades
			<CreateArcadeButton />
		</header>
		<Divider className="hidden sm:block" />
		<section className="w-full px-1 sm:p-0 sm:mt-4 flex flex-col gap-2 mx-auto">
			{!arcades.length && <span className="text-gray-500 italic ml-2">No arcades found</span>}

			{arcades.map(arcade => <article key={arcade.uuid}
				className="flex p-4 bg-content1 rounded gap-2 items-center flex-wrap text-xs sm:text-sm md:text-medium">
				{arcade.visibility === Visibility.PUBLIC && <Tooltip content="Public">
					<GlobeAltIcon className="h-6" />
				</Tooltip>}
				{arcade.visibility === Visibility.UNLISTED && <Tooltip content="Unlisted">
					<LinkIcon className="h-6" />
				</Tooltip>}
				{arcade.visibility === Visibility.PRIVATE && <Tooltip content="Private">
					<LockClosedIcon className="h-6" />
				</Tooltip>}
				<header className="text-lg font-semibold">
					{arcade.uuid ? <Link href={`/arcade/${arcade.uuid}`}
						className="hover:text-secondary transition">{arcade.name}</Link> : arcade.name}
				</header>
				{getLocation(arcade) && <span className="ml-3">
					<span className="font-semibold">Location:&nbsp;</span>
					{getLocation(arcade)}
				</span>}
				{arcade.ip && <span className="ml-3">
					<span className="font-semibold">IP:&nbsp;</span>
					{arcade.ip}
				</span>}
				<div className="ml-auto flex flex-wrap">

					{!!arcade.machineCount && <span className="mr-3">{arcade.machineCount!.toString()} Machine{Number(arcade.machineCount) > 1 ? 's' : ''}</span>}

					<Tooltip content={`${arcade.userCount} User${arcade.userCount === 1 ? '' : 's'}`}>
						<div className="flex gap-2 mr-3 items-center">
							<UserGroupIcon className="w-6" />
							<span>{arcade.userCount?.toString()}</span>
						</div>
					</Tooltip>

					Operated by&nbsp;{arcade.ownerUuid ?
					<Link href={`/user/${arcade.ownerUuid}`} className="font-semibold hover:text-secondary transition">
						{arcade.ownerUsername}
					</Link> : <span className="text-gray-500 italic">anonymous user</span>}
				</div>
			</article>)}
		</section>

	</main>);
}
