import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'

/**
 * 主题设置
 */
export const themeStore = defineStore({
  id: 'themeStore',
  state: () => ({
    isDark: false,
    primary: '#7E22CE',
  }),
  actions: {
    setDark(isDark) {
      this.isDark = isDark
    },
    setPrimary(primary) {
      this.primary = primary
    },
  },
  persist: piniaPersistConfig('ThemeStore'),
}) 