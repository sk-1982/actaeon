import { requireUser } from '@/actions/auth';
import { getGlobalConfig } from '@/config';
import { UserPermissions } from '@/types/permissions';
import { SystemConfig } from './system-config';

export default async function SystemConfigPage() {
	await requireUser({ permission: UserPermissions.SYSADMIN });
	
	const config = getGlobalConfig();

	return (<SystemConfig config={config} />);
};
