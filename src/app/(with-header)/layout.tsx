import { LayoutProps } from '@/types/layout';
import { ClientProviders } from '@/components/client-providers';
import { HeaderSidebar } from './header-sidebar';

export default async function HeaderLayout({children}: LayoutProps) {
	return (<ClientProviders>
		<HeaderSidebar>
			{ children }
		</HeaderSidebar>
	</ClientProviders>)
};
