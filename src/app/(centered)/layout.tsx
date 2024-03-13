import { LayoutProps } from '@/types/layout';
import { Viewport } from 'next';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	interactiveWidget: 'resizes-content'
};

export default function CenteredLayout({ children }: LayoutProps) {
	return <div className="flex flex-col items-center justify-center h-full">
		{children}
	</div>
}
