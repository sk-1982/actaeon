import { db } from '@/db';
import { InvalidLink } from '@/components/invalid-link';
import { requireUser } from '@/actions/auth';
import { notFound, redirect } from 'next/navigation';
import { JoinSuccess } from '@/components/join-success';

export default async function Join({ params }: { params: { arcadeId: string, join: string }}) {
	const user = await requireUser();

	if (!params.join)
		return (<InvalidLink />);

	const joinLink = await db.selectFrom('actaeon_arcade_ext as ext')
		.innerJoin('actaeon_arcade_join_keys as key', 'key.arcadeId', 'ext.arcadeId')
		.where('ext.uuid', '=', params.arcadeId)
		.where('key.id', '=', params.join)
		.select(['key.arcadeId', 'key.remainingUses', 'key.totalUses', 'key.id'])
		.executeTakeFirst();

	if (!joinLink)
		return (<InvalidLink />);

	const res = await db.selectFrom('arcade_owner')
		.where('arcade', '=', joinLink.arcadeId)
		.where('user', '=', user.id)
		.select('user')
		.executeTakeFirst();

	if (res)
		return redirect(`/arcade/${params.arcadeId}`);

	await db.transaction().execute(async trx => {
		await trx.insertInto('arcade_owner')
			.values({
				arcade: joinLink.arcadeId,
				user: user.id,
				permissions: 1
			})
			.executeTakeFirst();

		if (joinLink.remainingUses !== null && joinLink.remainingUses <= 1)
			await trx.deleteFrom('actaeon_arcade_join_keys')
				.where('id', '=', joinLink.id)
				.executeTakeFirst();
		else
			await trx.updateTable('actaeon_arcade_join_keys')
				.where('id', '=', joinLink.id)
				.set({
					totalUses: joinLink.totalUses + 1,
					...(joinLink.remainingUses ? {
						remainingUses: joinLink.remainingUses - 1
					} : {})
				})
				.executeTakeFirst();
	});

	return (<JoinSuccess href={`/arcade/${params.arcadeId}`} />);
}
