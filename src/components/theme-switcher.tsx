'use client';

import { useTheme } from 'next-themes';
import { Button } from '@nextui-org/button';
import { DropdownItem, DropdownTrigger, Dropdown, DropdownMenu } from '@nextui-org/dropdown';
import { Switch, SwitchProps } from '@nextui-org/switch';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useIsMounted } from 'usehooks-ts';
import { useEffect, useState } from 'react';

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

type ThemeSwitcherSwitchProps = {
	size?: SwitchProps['size'],
	className?: string
};

export function ThemeSwitcherSwitch({ size, className }: ThemeSwitcherSwitchProps) {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return null;

	return (<Switch size={size ?? 'lg'} className={className} isSelected={theme === 'dark'} thumbIcon={({ isSelected, className }) => isSelected ?
		<MoonIcon className={className} /> :
		<SunIcon className={className} /> } onValueChange={checked => setTheme(checked ? 'dark' : 'light')} />);
}
