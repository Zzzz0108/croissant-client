// 环境配置
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD
export const isTest = import.meta.env.MODE === 'test'

// 路由模式配置
export const routerMode = import.meta.env.VITE_ROUTER_MODE

// 开发环境判断函数
export const isDevelopment = () => isDev
export const isProduction = () => isProd
export const isTestMode = () => isTest

// 路由模式判断函数
export const isHashMode = () => routerMode === 'hash'
export const isHistoryMode = () => routerMode === 'history' 