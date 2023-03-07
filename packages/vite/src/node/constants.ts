// 默认配置文件列表
export const DEFAULT_CONFIG_FILES = [
  'vite.config.js',
  'vite.config.cjs',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.cts',
  'vite.config.mts',
]

// 查找 npm 包入口时使用的文件扩展列表
export const DEFAULT_EXTENSIONS = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx']

// 当解析 import  的路径不是一个浏览器可以解析的路径时，需要加这个前缀使其有效
export const VALID_ID_PREFIX = '/@id/'
