import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'

/**
 * 设置
 */
export const settingStore = defineStore({
  id: 'settingStore',
  state: () => ({
    isDrawerCover: true,
    isOriginalParsed: true,
    isTranslatedParsed: true,
    isRomaParsed: true,
    // 当前系统语言
    language: null,
  }),
  actions: {
    // Set SettingState
    setSettingState(...args) {
      this.$patch({ [args[0]]: args[1] })
    },
  },
  persist: piniaPersistConfig('settingStore'),
}) 