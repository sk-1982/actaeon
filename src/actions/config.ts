'use server';

import { setGlobalConfig as _setGlobalConfig } from '@/config';

export const setGlobalConfig: typeof _setGlobalConfig = async (config) => _setGlobalConfig(config);
