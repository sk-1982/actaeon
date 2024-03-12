import { LayoutProps } from '@/types/layout';

export default function CenteredLayout({ children }: LayoutProps) {
	return <div className="flex flex-col items-center justify-center h-full">
		{children}
	</div>
}
