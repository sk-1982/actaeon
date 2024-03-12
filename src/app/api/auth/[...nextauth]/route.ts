import { GET as authGet, POST as authPost } from '@/auth';
import { NextRequest } from 'next/server';

let basePath = process.env.BASE_PATH ?? '';
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1);

// https://github.com/vercel/next.js/issues/62756
const fixPath = (request: NextRequest) => {
	const newUrl = request.nextUrl.clone();
	// newUrl.pathname = `${basePath}${newUrl.pathname}`;
	newUrl.basePath = basePath;
	return new NextRequest(newUrl, request);
};
export async function GET(request: NextRequest) {
	return authGet(fixPath(request));
}

export async function POST(request: NextRequest) {
	return authPost(fixPath(request));
}
