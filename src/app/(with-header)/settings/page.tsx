import { getCards } from '@/actions/card';
import { Divider } from '@nextui-org/react';
import { AimeCard } from '@/components/aime-card';
import { UserSettings } from '@/components/user-settings';

export default async function SettingsPage() {
	const card = await getCards();


	return (<div className="w-full flex items-center justify-center">
		<div className="w-full max-w-full sm:max-w-5xl flex flex-col gap-2 2xl:max-w-screen-4xl 2xl:grid grid-cols-2">
			<div>
				<UserSettings />
			</div>

			<Divider className="block sm:hidden mt-2" />

			<div className="w-full rounded-lg sm:bg-content1 sm:shadow-lg">
				<div className="text-2xl font-semibold p-4">Cards</div>
				<Divider className="mb-4 hidden sm:block" />
				<div className="px-1 sm:px-4 sm:pb-4 flex flex-wrap items-center justify-center gap-4">
					{card.map(c => <AimeCard key={c.id} card={c} className="w-full" />)}
				</div>
			</div>
		</div>
	</div>);
}
