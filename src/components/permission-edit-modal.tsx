'use client';

import { Button, Checkbox, Modal, ModalContent, ModalHeader, Tooltip } from '@nextui-org/react';
import { useHashNavigation } from '@/helpers/use-hash-navigation';
import { ARCADE_PERMISSION_NAMES, ArcadePermissions, USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import Link from 'next/link';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import { useEffect, useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export type PermissionEditModalUser = {
	permissions: number,
	uuid?: string,
	id: number,
	username?: string | null
};

type PermissionEditModalProps = {
	user: PermissionEditModalUser | null,
	onClose: () => void,
	permissions: (typeof USER_PERMISSION_NAMES) | (typeof ARCADE_PERMISSION_NAMES),
	displayUpTo?: UserPermissions | ArcadePermissions,
	onEdit: (id: number, permissions: number) => void
};

export const PermissionEditModal = ({ user, onClose, permissions, displayUpTo, onEdit }: PermissionEditModalProps) => {
	const onModalClose = useHashNavigation({
		onClose,
		isOpen: user !== null,
		hash: '#permissions'
	});
	const [editingPermissions, setEditingPermissions] = useState(0);

	useEffect(() => {
		if (user) setEditingPermissions(user.permissions);
	}, [user?.permissions])

	return (<Modal onClose={onModalClose} isOpen={user !== null}>
		<ModalContent>
			{onClose => <>
				<ModalHeader>
					Editing user&nbsp;{user?.uuid && <Link href={`/user/${user.uuid}`} className="underline hover:text-secondary transition">
						{user?.username}
					</Link>}
				</ModalHeader>
				<ModalBody>
					{[...permissions].filter(([p]) => p <= (displayUpTo ?? Infinity))
						.map(([permission, { description, title }]) => <div key={permission} className="flex gap-2 items-center">
							<Checkbox size="lg" isSelected={!!(editingPermissions & (1 << permission))}
								onValueChange={selected => setEditingPermissions(p =>
									selected ? (p | (1 << permission)) : (p & ~(1 << permission)))}>
								{title}
							</Checkbox>
							<Tooltip content={description}>
								<QuestionMarkCircleIcon className="h-6" />
							</Tooltip>
						</div>)}
				</ModalBody>
				<ModalFooter>
					<Button variant="light" color="danger" onPress={onClose}>
						Cancel
					</Button>
					<Button color="primary" onPress={() => {
						onEdit(user?.id!, editingPermissions);
						onClose();
					}}>
						Save
					</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
}
