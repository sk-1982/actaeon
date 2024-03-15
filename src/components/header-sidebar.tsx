'use client';

import { Button, Divider } from '@nextui-org/react';
import { Bars3Icon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcherDropdown, ThemeSwitcherSwitch } from '@/components/theme-switcher';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import { login, logout } from '@/actions/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserPayload } from '@/types/user';
import { MAIN_ROUTES, ROUTES, UserOnly } from '@/routes';
import { useUser } from '@/helpers/use-user';

export type HeaderSidebarProps = {
	children?: React.ReactNode
};

const filterUserOnly = (user: UserPayload | null | undefined, { userOnly }: { userOnly?: UserOnly }) => {
	if (!userOnly) return true;
	if (typeof userOnly === 'string') return user?.[userOnly];
	return user;
};

export const HeaderSidebar = ({ children }: HeaderSidebarProps) => {
	const user = useUser();
	const path = usePathname();
	const params = useSearchParams();
	const [isMenuOpen, setMenuOpen] = useState(false);

	const from = params?.get('from');
	const filter = filterUserOnly.bind(null, user);
	const routeGroup = ROUTES.find(route => route.title === from || path?.startsWith(route.url))!;

	return (<>
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
							</div> : <Link href={route.url} onClick={() => setMenuOpen(false)}
								className={`text-2xl transition hover:text-secondary ${route === routeGroup ? 'font-bold' : 'font-semibold'}`}>
								{route.name}
							</Link>}
							<div className="ml-2 mt-2">
								{route.routes?.filter(filter)?.map(subroute => <div className="mb-1" key={subroute.url}>
									<Link href={subroute.url} onClick={() => setMenuOpen(false)}
										className={`text-xl transition hover:text-secondary ${path?.startsWith(subroute.url) ? 'font-semibold' : ''}`}>
										{subroute.name}
									</Link>
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
		<div className="flex flex-col flex-grow">
			<div className="flex p-6 items-center flex-shrink-0 fixed top-0 left-0 w-full bg-background/80 z-[48] backdrop-blur-2xl">
				<Button className="text-2xl font-bold cursor-pointer flex items-center m-0 ps-1.5 pe-2 mr-6" variant="light"
					onClick={() => setMenuOpen(true)}>
					<Bars3Icon className="h-6 mt-0.5" />
					<span>{ routeGroup.title }</span>
				</Button>
				<div className="mr-auto mt-1 hidden md:flex text-lg">
					{routeGroup.routes?.filter(filter).map(route =>
						<Link href={route.url} key={route.url} className={`mr-4 transition ${path?.startsWith(route.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
							{route.name}
						</Link>)
					}
				</div>
				{routeGroup !== MAIN_ROUTES && <div className="mr-4 mt-1 hidden lg:flex text-lg transition hover:text-secondary">
					{MAIN_ROUTES.routes.filter(filter).map(route => <Link
						href={`${route.url}?from=${encodeURIComponent(routeGroup.title)}`} key={route.url}
						className={`mr-4 transition ${path?.startsWith(route.url) ? 'font-semibold text-primary' : 'hover:text-secondary'}`}>
						{route.name}
					</Link>)}
        </div>}
				<div className="hidden md:flex">
					<Link href={routeGroup === MAIN_ROUTES ? '/settings' : `/settings?from=${encodeURIComponent(routeGroup.title)}`}>
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
			<div className="sm:px-5 flex-grow pt-fixed flex flex-col">
				{children}
			</div>
		</div>
	</>)
};
