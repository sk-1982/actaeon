import { Button, Checkbox, Modal, ModalContent, ModalHeader, Tooltip } from '@nextui-org/react';
import { useHashNavigation } from '@/helpers/use-hash-navigation';
import { ARCADE_PERMISSION_NAMES, ArcadePermissions, USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import Link from 'next/link';
import { ModalBody, ModalFooter } from '@nextui-org/modal';
import { useEffect, useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useConfirmModal } from './confirm-modal';

export type PermissionEditModalUser = {
	permissions: number | null,
	uuid?: string | null,
	id: number | null,
	username?: string | null
};

type PermissionEditModalProps = {
	user: PermissionEditModalUser | null,
	onClose: () => void,
	permissions: (typeof USER_PERMISSION_NAMES) | (typeof ARCADE_PERMISSION_NAMES),
	displayUpTo?: UserPermissions | ArcadePermissions,
	onEdit: (id: number, permissions: number) => void,
	disallowDemoteOwners?: boolean
};

export const PermissionEditModal = ({ user, onClose, permissions, displayUpTo, onEdit, disallowDemoteOwners }: PermissionEditModalProps) => {
	const onModalClose = useHashNavigation({
		onClose,
		isOpen: user !== null,
		hash: '#permissions'
	});
	const [editingPermissions, setEditingPermissions] = useState(0);
	const confirm = useConfirmModal();

	useEffect(() => {
		if (user) setEditingPermissions(user.permissions!);
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
								isDisabled={permission === UserPermissions.OWNER && disallowDemoteOwners && !!(user?.permissions! & (1 << UserPermissions.OWNER))}
								onValueChange={selected => setEditingPermissions(p =>
									selected ? (p | (1 << permission)) : (p & ~(1 << permission)))}>
								{title}
							</Checkbox>
							<Tooltip content={permission === UserPermissions.OWNER && disallowDemoteOwners ? `${description} (owners cannot be removed from the owner role)` : description}>
								<QuestionMarkCircleIcon className="h-6" />
							</Tooltip>
						</div>)}
				</ModalBody>
				<ModalFooter>
					<Button variant="light" color="danger" onPress={onClose}>
						Cancel
					</Button>
					<Button color="primary" onPress={() => {
						const id = user?.id!;
						const permissions = editingPermissions;
						onClose();
						if (disallowDemoteOwners && !(user?.permissions! & (1 << UserPermissions.OWNER)) && (editingPermissions & (1 << UserPermissions.OWNER))) {
							setTimeout(() => {
								confirm('Once a user is promoted to owner, they cannot be removed from the owner role.', () => onEdit(id, permissions))
							}, 15);
						} else {
							onEdit(id, permissions);
						}
					}}>
						Save
					</Button>
				</ModalFooter>
			</>}
		</ModalContent>
	</Modal>)
}
