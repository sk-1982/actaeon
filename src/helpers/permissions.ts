import { ArcadePermissions, UserPermissions } from '@/types/permissions';
import { redirect } from 'next/navigation';


/**
 * Check if user has permission
 * @param userPermission user's permission mask
 * @param requestedPermission requested permission, passing a single permission will check if a user has that permission,
 *  passing an array will check that the user has at least one of the permissions
 */
export const hasPermission = <T extends UserPermissions | ArcadePermissions>(userPermission: number | null | undefined, ...requestedPermission: (T | T[])[]) => {
	if (!userPermission)
		return false;

	if (userPermission & (1 << UserPermissions.OWNER) || !requestedPermission.length)
		return true;

	return requestedPermission.every(perm => {
		if (Array.isArray(perm))
			return perm.some(p => userPermission & (1 << p));

		return userPermission & (1 << perm);
	});
}

/**
 * Check if user has permission and redirect to unauthorized if not
 * @param userPermission user's permission mask
 * @param requestedPermission requested permission, passing a single permission will check if a user has that permission,
 *  passing an array will check that the user has at least one of the permissions
 */
export const requirePermission = <T extends UserPermissions | ArcadePermissions>(userPermission: number | null | undefined, ...requestedPermission: (T | T[])[]) => {
	if (!hasPermission(userPermission, ...requestedPermission))
		redirect('/forbidden');
}

/**
 * Check if user has arcade permission
 *
 * @param userArcadePermission user's arcade permission mask
 * @param userPermission user's permission mask
 * @param requestedPermissions requested permissions
 */
export const hasArcadePermission = (userArcadePermission: number | null | undefined, userPermission: number | null | undefined,
                                          ...requestedPermissions: (ArcadePermissions | ArcadePermissions[])[]) => {
	if (hasPermission(userPermission, UserPermissions.ACMOD))
		return true;

	if (!userArcadePermission)
		return false;

	return hasPermission(userArcadePermission, ...requestedPermissions);
}

/**
 * Check if user has arcade permission
 *
 * @param userArcadePermission user's arcade permission mask
 * @param userPermission user's permission mask
 * @param requestedPermissions requested permissions
 */
export const requireArcadePermission =  (userArcadePermission: number | null | undefined, userPermission: number | null | undefined,
                                         ...requestedPermissions: (ArcadePermissions | ArcadePermissions[])[]) => {
	if (!hasArcadePermission(userArcadePermission, userPermission, ...requestedPermissions))
		redirect('/forbidden');
}
