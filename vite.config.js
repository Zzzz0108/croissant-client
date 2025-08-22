import { defineConfig, loadEnv } from 'vite'//defineConfig定义配置，loadEnv加载环境变量
import { fileURLToPath, URL } from 'node:url'//fileURLToPath将URL转换为文件路径，URL用于创建/处理URL对象
import { wrapperEnv } from './build/getEnv'//自定义wrapperEnv包装环境变量
import { createProxy } from './build/proxy'//自定义createProxy创建代理配置
import { createVitePlugins } from './build/plugins'//自定义createVitePlugins创建插件集合

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd()//获取当前工作目录
  const env = loadEnv(mode, root)//根据当前模式加载环境变量文件如.env.development或.env.production
  const viteEnv = wrapperEnv(env)//使用自定义函数处理原始环境变量

  return {
    plugins: createVitePlugins(viteEnv),//使用自定义函数创建插件集合
    server: {
      port: 8090,
      host: true,
      // 代理配置
      proxy: createProxy(viteEnv.VITE_PROXY),//基于 VITE_PROXY 环境变量创建代理配置
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),//将src目录别名为@
      },
    },
    base: viteEnv.VITE_PUBLIC_PATH,//设置基础路径
    build: {
      // outDir: 'xxxxx', // 设置输出目录
      rollupOptions: {
        // 静态资源分类打包
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          // 静态资源分拆打包
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.toString().indexOf('.pnpm/') !== -1) {
                return id.toString().split('.pnpm/')[1].split('/')[0].toString()
              } else if (id.toString().indexOf('node_modules/') !== -1) {
                return id
                  .toString()
                  .split('node_modules/')[1]
                  .split('/')[0]
                  .toString()
              }
            }
          },
        },
      },
    },
  }
}) 