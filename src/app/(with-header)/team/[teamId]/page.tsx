import { getUser } from '@/actions/auth';
import { getTeamInviteLinks, getTeams, getTeamUsers } from '@/data/team';
import { notFound } from 'next/navigation';
import { PrivateVisibilityError } from '@/components/private-visibility-error';
import { TeamDetail } from './team';

export default async function TeamDetailPage({ params }: { params: { teamId: string }}) {
	const user = await getUser();
	const team = (await getTeams({ user, uuids: [params.teamId], showUnlisted: true }))[0];
	
	if (!team)
		return notFound();

	const [users, links] = await Promise.all([
		getTeamUsers({ user, team }),
		getTeamInviteLinks({ user, team })
	]);

	if (!team.visible)
		return <PrivateVisibilityError />;
	
	return (<TeamDetail team={team} users={users} links={links} />)
}
