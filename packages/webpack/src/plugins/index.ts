import { EntryPlugin } from './EntryPlugin'

import type { WebpackPlugin } from '../typings'

export const innerPlugins: WebpackPlugin[] = [new EntryPlugin()]
