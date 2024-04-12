'use client';

import { Button, ButtonProps } from '@nextui-org/button';

type BackButtonProps = Partial<ButtonProps> & {
	referer?: string | null
};

export const BackButton = ({ children, referer, ...props }: BackButtonProps) => {
	if (referer === null)
		return null;

	if (referer && globalThis.location && globalThis.location?.origin !== new URL(referer).origin)
		return null;

	return (<Button {...props} onClick={() => history.back()}>
		{children}
	</Button>);
};
