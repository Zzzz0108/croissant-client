import vue from "@vitejs/plugin-vue";
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'

export const createVitePlugins = (viteEnv) => {
    return [
        vue(),
        // basicSsl() 模拟https的配置,
        Components({
            dirs: ['src/components'],
            resolvers: [
                // 集成图标集
                IconsResolver({
                    prefix: 'icon' // 私有前缀
                })
            ]
        }),
        Icons({
            autoInstall: true // 自动安装所需图标集
        }),
    ]
} 