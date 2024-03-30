'use client';

import { Button, Tooltip } from '@nextui-org/react';
import { usePromptModal } from './prompt-modal';
import { useErrorModal } from './error-modal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/helpers/use-user';
import { createTeam } from '@/actions/team';

export const CreateTeamButton = () => {
	const prompt = usePromptModal();
	const setError = useErrorModal();
	const user = useUser();
	
	if (!user) return null;

	return (<Tooltip content="Create new team">
		<Button isIconOnly className="ml-auto" onPress={() => prompt({
			title: 'Enter name', message: 'Enter a name for this team',
			label: 'Name'
		}, val => {
			if (!val)
				return setError('Name is required');
			createTeam(val)
				.then(res => res?.error && setError(res.message));
		})}>
			<PlusIcon className="h-3/4" />
		</Button>
	</Tooltip>);
};