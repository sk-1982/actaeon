'use client';

import { Button, Tooltip } from '@nextui-org/react';
import { createArcade } from '@/actions/arcade';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/helpers/use-user';
import { hasPermission } from '@/helpers/permissions';
import { UserPermissions } from '@/types/permissions';
import { usePromptModal } from '@/components/prompt-modal';
import { useErrorModal } from '@/components/error-modal';

export const CreateArcadeButton = () => {
	const user = useUser();
	const prompt = usePromptModal();
	const setError = useErrorModal();
	if (!hasPermission(user?.permissions, UserPermissions.ACMOD))
		return null;

	return (<Tooltip content="Create new arcade">
		<Button isIconOnly className="ml-auto" onPress={() => prompt({
			title: 'Enter name', message: 'Enter a name for this arcade',
			label: 'Name'
		}, val => {
			if (!val)
				return setError('Name is required');
			createArcade(val);
		})}>
			<PlusIcon className="h-3/4" />
		</Button>
	</Tooltip>);
}
