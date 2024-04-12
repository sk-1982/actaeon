import { Visibility } from '@/types/privacy-visibility';
import { VisibilityIcon } from './visibility-icon';
import { Button } from '@nextui-org/button';
import { DropdownItem, DropdownTrigger, Dropdown, DropdownMenu } from '@nextui-org/dropdown';
import { ChevronDownIcon, GlobeAltIcon, LinkIcon, LockClosedIcon } from '@heroicons/react/24/outline';

type VisibilityDropdownProps = {
	visibility: Visibility,
	editing: boolean,
	loading: boolean,
	onVisibilityChange: (visibility: Visibility) => void
};

export const VisibilityDropdown = ({ visibility, editing, loading, onVisibilityChange }: VisibilityDropdownProps) => {
	const icon = (<VisibilityIcon visibility={visibility} className="h-8" />);

	if (!editing)
		return icon;

	return (<Dropdown isDisabled={loading}>
		<DropdownTrigger>
			<Button isIconOnly variant="light" size="lg" className="ml-2 w-20">
				{icon}
				<ChevronDownIcon className="w-7" />
			</Button>
		</DropdownTrigger>
		<DropdownMenu selectionMode="single" selectedKeys={new Set([visibility.toString()])}
			onSelectionChange={s => typeof s !== 'string' && s.size && onVisibilityChange(+[...s][0] as any)}>
			<DropdownItem key={Visibility.PRIVATE} description="Visible only to arcade members"
				startContent={<LockClosedIcon className="h-6" />}>
				Private
			</DropdownItem>
			<DropdownItem key={Visibility.UNLISTED}
				description="Visible to those who have the link to this page"
				startContent={<LinkIcon className="h-6" />}>
				Unlisted
			</DropdownItem>
			<DropdownItem key={Visibility.PUBLIC} description="Visible to everyone"
				startContent={<GlobeAltIcon className="h-6" />}>
				Public
			</DropdownItem>
		</DropdownMenu>
	</Dropdown>);
};
