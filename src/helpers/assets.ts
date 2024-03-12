let baseAssetUrl = process.env.NEXT_PUBLIC_ASSET_URL ?? process.env.ASSET_URL ?? '/';
if (!baseAssetUrl.endsWith('/')) baseAssetUrl += '/';

export const getAssetUrl = (path: string, extension?: `.${string}`) => {
	path = path.replace(/^\/|\/$/g, '');

	if (!extension)
		return baseAssetUrl + path;

	const parts = path.split('/');
	let name = parts.pop()!;
	const lastIndex = name.lastIndexOf('.');
	if (lastIndex !== -1)
		name = name.slice(0, lastIndex);
	parts.push(name + extension);

	return baseAssetUrl + parts.join('/');
};

export const getImageUrl = (path: string) => getAssetUrl(path, process.env.NEXT_PUBLIC_ASSET_IMAGE_EXTENSION as any);
export const getJacketUrl = (path: string) => getAssetUrl(path, process.env.NEXT_PUBLIC_ASSET_JACKET_EXTENSION as any);
export const getMusicUrl = (path: string) => getAssetUrl(path, process.env.NEXT_PUBLIC_ASSET_MUSIC_EXTENSION as any);
export const getAudioUrl = (path: string) => getAssetUrl(path, process.env.NEXT_PUBLIC_ASSET_AUDIO_EXTENSION as any);
