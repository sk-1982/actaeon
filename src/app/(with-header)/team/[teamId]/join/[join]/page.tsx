import { requireUser } from '@/actions/auth';
import { InvalidLink } from '@/components/invalid-link';
import { JoinSuccess } from '@/components/join-success';
import { syncUserTeams } from '@/data/team';
import { db } from '@/db';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';

export default async function Join({ params }: { params: { teamId: string, join: string; }; }) {
	const user = await requireUser();
	
	if (!params.join)
		return (<InvalidLink />);
	
	if (user.team === params.teamId)
		return redirect(`/team/${params.teamId}`)
	
	if (user.team)
		return (<main className="flex flex-col w-full m-auto items-center gap-4 pb-10 text-center">
			<ExclamationCircleIcon className="w-48 h-48 mb-10" />
			<header className="text-2xl font-semibold">You are already part of a team.</header>
			<span>You must leave your current team before joining a new one.</span>
		</main>);
	
	const joinLink = await db.selectFrom('actaeon_teams as team')
		.innerJoin('actaeon_team_join_keys as key', 'key.teamId', 'team.uuid')
		.where('team.uuid', '=', params.teamId)
		.where('key.id', '=', params.join)
		.select(['key.teamId', 'key.remainingUses', 'key.totalUses', 'key.id', 'team.chuniTeam'])
		.executeTakeFirst();
	
	if (!joinLink)
		return (<InvalidLink />);
	
	await db.transaction().execute(async trx => {
		await trx.updateTable('actaeon_user_ext')
			.where('userId', '=', user.id)
			.set({ team: params.teamId })
			.executeTakeFirst();
		
		if (joinLink.remainingUses !== null && joinLink.remainingUses <= 1)
			await trx.deleteFrom('actaeon_team_join_keys')
				.where('id', '=', joinLink.id)
				.executeTakeFirst();
		else
			await trx.updateTable('actaeon_team_join_keys')
				.where('id', '=', joinLink.id)
				.set({
					totalUses: joinLink.totalUses + 1,
					...(joinLink.remainingUses ? {
						remainingUses: joinLink.remainingUses - 1
					} : {})
				})
				.executeTakeFirst()
		
		await syncUserTeams(user.id, joinLink, trx);
	});

	return (<JoinSuccess href={`/team/${params.teamId}`} />)
}