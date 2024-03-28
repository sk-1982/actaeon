import { NextRequest, NextResponse } from 'next/server';
import { uncachedAuth } from '@/auth';

export const middleware = uncachedAuth((request: NextRequest) => {
	const headers = new Headers(request.headers);
	headers.set('x-path', request.nextUrl.basePath + request.nextUrl.pathname);

	const options: ResponseInit & { request: { headers: Headers; }; } = {
		request: { headers }
	};

	if (request.nextUrl.pathname === '/') {
		const newUrl = request.nextUrl.clone();
		newUrl.pathname = request.auth?.user?.homepage ?? '/dashboard';
		return NextResponse.rewrite(newUrl, options);
	}

	if (request.nextUrl.pathname === '/forbidden')
		options.status = 403;
	else if (request.nextUrl.pathname === '/auth/login' && request.nextUrl.searchParams.get('error'))
		options.status = 401;

	return NextResponse.next(options);
});
