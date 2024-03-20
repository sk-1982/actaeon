import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const headers = new Headers(request.headers);
	headers.set('x-path', request.nextUrl.basePath + request.nextUrl.pathname);
	return NextResponse.next({
		request: { headers }
	});
}
