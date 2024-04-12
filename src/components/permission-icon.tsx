import { USER_PERMISSION_NAMES, UserPermissions } from '@/types/permissions';
import { Tooltip } from '@nextui-org/tooltip';
import { TbBrandAppleArcade, TbCrown, TbFileSettings, TbUserShield } from 'react-icons/tb';

const PERMISSION_ICONS = new Map([
	[UserPermissions.USERMOD, TbUserShield],
	[UserPermissions.ACMOD, TbBrandAppleArcade],
	[UserPermissions.SYSADMIN, TbFileSettings],
	[UserPermissions.OWNER, TbCrown]
]);

type PermissionIconsProps = {
	permission: UserPermissions,
	className?: string
};

export const PermissionIcon = ({ permission, className }: PermissionIconsProps) => { 
	const Icon = PERMISSION_ICONS.get(permission);

	if (!Icon) return null;

	return (<Tooltip content={USER_PERMISSION_NAMES.get(permission)?.title!}>
		<div>
			<Icon className={className} />
		</div>
	</Tooltip>)
};