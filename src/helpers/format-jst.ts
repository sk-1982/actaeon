const DEFAULT_OPTIONS = {
	month: 'numeric',
	day: 'numeric',
	year: '2-digit',
	hour: 'numeric',
	minute: '2-digit'
} as const;

export const formatJst = (time: string, options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS) => new Date(`${time} +0900`)
	.toLocaleTimeString(undefined, DEFAULT_OPTIONS);

