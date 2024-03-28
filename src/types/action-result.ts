export type ActionResult<T = {}> = { error: true, message: string } |
	({ error?: false | null, message?: string; } & T);
