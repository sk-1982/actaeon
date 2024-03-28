'use client';

import { Button, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Navbar } from '@nextui-org/react';
import { Bars3Icon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcherDropdown, ThemeSwitcherSwitch } from '@/components/theme-switcher';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { login, logout } from '@/actions/auth';
import { usePathname, useRouter } from 'next/navigation';
import { UserPayload } from '@/types/user';
import { MAIN_ROUTES, ROUTES, Subroute, UserOnly, filterRoute } from '@/routes';
import { useUser } from '@/helpers/use-user';
import { useBreakpoint } from '@/helpers/use-breakpoint';
import { useCookies } from 'next-client-cookies';
import { UserPermissions } from '@/types/permissions';
import { hasPermission } from '@/helpers/permissions';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type HeaderSidebarProps = {
	children?: React.ReactNode,
};

export const HeaderSidebar = ({ children }: HeaderSidebarProps) => {
	const user = useUser();
	const pathname = usePathname();
	const [isMenuOpen, setMenuOpen] = useState(false);
	const breakpoint = useBreakpoint();
	const cookies = useCookies();
	const router = useRouter();

	const path = pathname === '/' ? (user?.homepage ?? '/dashboard') : pathname;

	const from = cookies.get('actaeon-navigated-from');
	const filter = filterRoute.bind(null, user);
	const routeGroup = ROUTES.find(route => route.title === from || path?.startsWith(route.url))!;

	const renderHeaderLink = (route: Subroute) => {
		const linkStyle = path?.startsWith(route.url) ?
			'font-semibold text-primary' : 'hover:text-secondary';

		if (route.routes?.length)
			return (<Dropdown key={route.url}>
				<DropdownTrigger>
					<Button className="bg-transparent p-0 m-0 min-h-0 min-w-0 h-auto overflow-visible" disableRipple>
						<div className={`flex items-center cursor-pointer mr-4 transition text-lg ${linkStyle}`} >
							{route.name}
							<ChevronDownIcon className="h-5 ml-1 mt-1" />
						</div>
					</Button>
				</DropdownTrigger>
				<DropdownMenu>
					{route.routes.filter(filter)
						.map(route => (<DropdownItem key={route.url} className="[&:hover_*]:text-secondary"
							onPress={() => {
							router.push(route.url);
							cookies.set('actaeon-navigated-from', routeGroup.title);
						}}
						onMouseEnter={() => router.prefetch(route.url)}>
						<span className={`transition text-medium ${path?.startsWith(route.url) ? 'font-semibold text-primary' : ''}`}>{route.name}</span>
					</DropdownItem>))}
				</DropdownMenu>
			</Dropdown>);

		return (<Link
			onClick={() => {
				cookies.set('actaeon-navigated-from', routeGroup.title);
			}}
			href={`${route.url}`} key={route.url}
			className={`mr-4 transition ${linkStyle}`}>
			{route.name}
		</Link>);
	}

	return (<>
		{/* begin sidebar */}
		<div className={`fixed inset-0 w-full h-full z-[49] ${isMenuOpen ? '' : 'pointer-events-none'}`}>
			<div className={`transition bg-black z-[49] absolute inset-0 w-full h-full ${isMenuOpen ? 'bg-opacity-25' : 'bg-opacity-0 pointer-events-none'}`} onClick={() => setMenuOpen(false)} />
			<div className={`dark flex flex-col text-white absolute p-6 top-0 h-full max-w-full w-96 bg-gray-950 z-[49] transition-all ${isMenuOpen ? 'left-0 shadow-2xl' : '-left-full'}`}>
				<div className="flex">
					<Button className="text-2xl mb-6 font-bold cursor-pointer flex items-center ps-1.5 pe-2" variant="light"
						onClick={() => setMenuOpen(false)}>
						<ChevronLeftIcon className="h-6 mt-0.5" />
						<span>{ routeGroup.title }</span>
					</Button>
					<Button className="ml-auto" isIconOnly color="danger" onClick={() => setMenuOpen(false)}>
						<XMarkIcon className="w-5" />
					</Button>
				</div>
				<div className="overflow-y-auto">
					{ROUTES.map((route, i) => <Fragment key={i}>
						<div>
							{!filter(route) ? <div className={`select-none text-2xl ${route === routeGroup ? 'font-bold' : 'font-semibold'}`}>
								{route.name}
							</div> : <Link href={route.url} onClick={() => {
								setMenuOpen(false);
								cookies.remove('actaeon-navigated-from');
							}}
								className={`text-2xl transition hover:text-secondary ${route === routeGroup ? 'font-bold' : 'font-semibold'}`}>
								{route.name}
							</Link>}
							<div className="ml-2 mt-2">
								{route.routes?.filter(filter)?.map(subroute => <div className="mb-1" key={subroute.url}>
									{subroute.routes?.length ? <div
										className={`text-xl`}>
										{subroute.name}
										<div className="flex flex-col ml-1.5 pl-3 border-l border-gray-500/25 mt-0.5">
											{subroute.routes.filter(filter).map(route => (<Link href={route.url} key={route.url}
												className={`text-[1.075rem] transition ${path?.startsWith(route.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
												{route.name}
											</Link>))}
										</div>
									</div> : <Link href={subroute.url} onClick={() => {
										setMenuOpen(false);
										cookies.remove('actaeon-navigated-from');
									}}
										className={`text-xl transition ${path?.startsWith(subroute.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
										{subroute.name}
									</Link>}
								</div>)}
							</div>
						</div>
						{i < ROUTES.length - 1 && <Divider className="my-5" />}
					</Fragment>)}
				</div>
				<div className="mt-auto mb-4 flex items-baseline">
					<ThemeSwitcherSwitch />

					{user && <Link href="/settings" className="ml-auto">
              <Button isIconOnly variant="bordered" size="lg">
                  <AdjustmentsHorizontalIcon className="w-8" />
              </Button>
          </Link>}
				</div>
				<Button color="primary" className="w-full" onClick={() => user ? logout({ redirectTo: '/' }) : login()}>
					{user ? 'Logout' : 'Login'}
				</Button>
			</div>
		</div>
		{/* end sidebar */}

		{/* begin top navbar */}
		<div className="flex flex-col flex-grow">
			<Navbar className="w-full fixed" classNames={{ wrapper: 'max-w-full p-0' }} shouldHideOnScroll={breakpoint === undefined} height="5.5rem">
				<div className="flex p-6 items-center flex-shrink-0 w-full z-[48]">
					<Button className="text-2xl font-bold cursor-pointer flex items-center m-0 ps-1.5 pe-2 mr-6" variant="light"
						onClick={() => setMenuOpen(true)}>
						<Bars3Icon className="h-6 mt-0.5" />
						<span>{ routeGroup.title }</span>
					</Button>
					<div className="mr-auto mt-1 hidden md:flex text-lg">
						{routeGroup.routes?.filter(filter).map(renderHeaderLink)}
					</div>
					{routeGroup !== MAIN_ROUTES && <div className="mr-4 mt-1 hidden [@media(min-width:1080px)]:flex text-lg">
						{MAIN_ROUTES.routes.filter(filter).map(renderHeaderLink)}
				  </div>}
					<div className="hidden md:flex">
						<Link href="/settings">
							{user && <Button isIconOnly variant="bordered" size="sm" className="mr-2">
				          <AdjustmentsHorizontalIcon className="w-6" />
				      </Button>}
						</Link>
						<ThemeSwitcherDropdown />
						<Button size="sm" className="ml-2" color="primary" onClick={() => user ? logout({ redirectTo: '/' }) : login()}>
							{user ? 'Logout' : 'Login'}
						</Button>
					</div>
				</div>
			</Navbar>

			<div className="sm:px-5 flex-grow pt-fixed flex flex-col">
				{children}
			</div>
		</div>
		{/*	end top navbar */}
	</>)
};
