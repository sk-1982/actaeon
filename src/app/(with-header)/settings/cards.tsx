'use client';

import { DB } from '@/types/db';
import { AimeCard } from '@/components/aime-card';
import { Button, Divider, Tooltip } from '@nextui-org/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usePromptModal } from '@/components/prompt-modal';
import { promptAccessCode } from '@/components/prompt-access-code';
import { useUser } from '@/helpers/use-user';
import { UserPermissions } from '@/types/permissions';
import { hasPermission } from '@/helpers/permissions';
import { useErrorModal } from '@/components/error-modal';
import { useState } from 'react';
import { deleteCard, userAddCard } from '@/actions/card';

export type CardsProps = {
	cards: DB['aime_card'][],
	canAddCard: boolean,
	maxCard: number | null
};

export const Cards = ({ cards: initialCards, canAddCard, maxCard }: CardsProps) => {
	const prompt = usePromptModal();
	const user = useUser({ required: true });
	const setError = useErrorModal();
	const [cards, setCards] = useState(initialCards);

	return (<section className="w-full rounded-lg sm:bg-content1 sm:shadow-lg">
		<header className="text-2xl font-semibold flex px-4 h-16 items-center">
			Cards

			{(hasPermission(user.permissions, UserPermissions.USERMOD) ||
				(canAddCard && cards.length < (maxCard ?? Infinity))) && <Tooltip content="Add card">
					<Button isIconOnly className="ml-auto" onPress={() => {
						promptAccessCode(prompt, 'Enter an access code for this card', code => {
							userAddCard(code)
								.then(res => {
									if (res.error)
										return setError(res.message);
									setCards(c => [...c, res.card]);
								})
						});
				}}>
					<PlusIcon className="h-3/4" />
				</Button>
			</Tooltip>}
		</header>
		<Divider className="mb-4 hidden sm:block" />
		<div className="px-1 sm:px-4 sm:pb-4 flex flex-wrap items-center justify-center gap-4">
			{cards.map(c => <AimeCard canDelete key={c.id} card={c} className="w-full" onDelete={() => {
				deleteCard(user.id, c.id);
				setCards(cards => cards.filter(card => card.id !== c.id));
			}} />)}
		</div>
	</section>);
};
