import { getCards } from '@/actions/card';
import { Divider } from '@nextui-org/react';
import { UserSettings } from './user-settings';
import { Cards } from './cards';
import { requireUser } from '@/actions/auth';
import { getGlobalConfig } from '@/config';

export default async function SettingsPage() {
	const user = await requireUser();
	const cards = await getCards(user.id);

	return (<div className="w-full flex items-center justify-center">
		<div className="w-full max-w-full sm:max-w-5xl flex flex-col gap-2 2xl:max-w-screen-4xl 2xl:grid grid-cols-12">
			<div className="col-span-3">
				<UserSettings />
			</div>

			<Divider className="block sm:hidden mt-2" />

			<div className="col-span-9">
				<Cards cards={cards} canAddCard={getGlobalConfig('allow_user_add_card')} maxCard={getGlobalConfig('user_max_card') ?? Infinity} />
			</div>
		</div>
	</div>);
}
