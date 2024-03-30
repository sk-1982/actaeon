import { GlobeAltIcon, LinkIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Visibility } from '@/types/privacy-visibility';
import { Tooltip } from '@nextui-org/react';

export const VisibilityIcon = ({ visibility, className }: { visibility: Visibility, className?: string; }) => {
	if (visibility === Visibility.PUBLIC)
		return (<Tooltip content="Public">
			<GlobeAltIcon className={className} />
		</Tooltip>);
	
	if (visibility === Visibility.UNLISTED)
		return (<Tooltip content="Unlisted">
			<LinkIcon className={className} />
		</Tooltip>);
	
	return (<Tooltip content="Private">
		<LockClosedIcon className={className} />
	</Tooltip>);
};