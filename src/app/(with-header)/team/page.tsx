import { getUser } from '@/actions/auth';
import { CreateTeamButton } from '@/components/create-team-button';
import { VisibilityIcon } from '@/components/visibility-icon';
import { getTeams } from '@/data/team';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Divider, Tooltip } from '@nextui-org/react';
import Link from 'next/link';

export default async function TeamPage() {
	const user = await getUser();
	const teams = (await getTeams({ user }))
		.filter(t => t.visible);

	return (<main className="flex flex-col max-w-5xl mx-auto w-full">
		<header className="font-semibold flex items-center text-2xl p-4">
			Teams

			{!teams[0]?.isMember && <CreateTeamButton />}
		</header>

		<Divider className="hidden sm:block" />

		<section className="w-full px-1 sm:p-0 sm:mt-4 flex flex-col gap-2 mx-auto">
			{!teams.length && <span className="italic text-gray-500 ml-2">No teams found</span>}
			
			{teams.map(team => <article key={team.uuid}
				className="flex p-4 bg-content1 rounded gap-2 items-center flex-wrap text-xs sm:text-sm md:text-medium">
				<VisibilityIcon visibility={team.visibility} className="h-6" />
				<Link href={`/team/${team.uuid}`} className="font-semibold transition hover:text-secondary">
					{team.name}
				</Link>
				{team.isMember && <Tooltip content="Your team">
					<StarIcon className="h-6 text-amber-400" />
				</Tooltip>}

				<Tooltip content={`${team.userCount} User${team.userCount === 1 ? '' : 's'}`}>
					<div className="flex gap-2 mr-3 items-center ml-auto">
						<UserGroupIcon className="w-6" />
						<span>{team.userCount?.toString()}</span>
					</div>
				</Tooltip>

				<span>
					Leader:&nbsp;
					{team.ownerUsername ? <Link href={`/user/${team.ownerUuid}`} className="font-semibold transition hover:text-secondary">
						{team.ownerUsername}
					</Link> : <span className="italic text-gray-500">anonymous user</span>}
				</span>
			</article>)}
		</section>
	</main>);
}
