'use client';

import { useTheme } from 'next-themes';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Switch } from '@nextui-org/react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useIsMounted } from 'usehooks-ts';

const THEME_SWITCHER_STYLE = { zIndex: 99999999999 } as const;

export function ThemeSwitcherDropdown() {
	const { setTheme } = useTheme();

	return (<Dropdown style={THEME_SWITCHER_STYLE}>
		<DropdownTrigger>
			<Button variant="bordered" isIconOnly size="sm">
				<MoonIcon className="w-5" />
			</Button>
		</DropdownTrigger>
		<DropdownMenu>
			<DropdownItem onClick={() => setTheme('dark')}>
				Dark
			</DropdownItem>
			<DropdownItem onClick={() => setTheme('light')}>
				Light
			</DropdownItem>
			<DropdownItem onClick={() => setTheme('system')}>
				System
			</DropdownItem>
		</DropdownMenu>
	</Dropdown>);
}

export function ThemeSwitcherSwitch() {
	const { setTheme, theme } = useTheme();
	const mounted = useIsMounted();
	if (!mounted()) return null;

	return (<Switch size="lg" isSelected={theme === 'dark'} thumbIcon={({ isSelected, className }) => isSelected ?
		<MoonIcon className={className} /> :
		<SunIcon className={className} /> } onChange={ev => setTheme(ev.target.checked ? 'dark' : 'light')} />);
}
