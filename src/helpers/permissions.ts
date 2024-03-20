import { ArcadePermissions, UserPermissions } from '@/types/permissions';
import { redirect } from 'next/navigation';



export const hasPermission = <T extends UserPermissions | ArcadePermissions>(userPermission: number | null | undefined, ...requestedPermission: T[]) => {
	if (!userPermission)
		return false;

	if (userPermission & (1 << UserPermissions.OWNER))
		return true;

	const permissionMask = requestedPermission
		.reduce((mask, permission) => mask | (1 << permission), 0);

	return (userPermission & permissionMask) === permissionMask;
}

export const requirePermission = <T extends UserPermissions | ArcadePermissions>(userPermission: number | null | undefined, ...requestedPermission: T[]) => {
	if (!hasPermission(userPermission, ...requestedPermission))
		redirect('/unauthorized');
}
