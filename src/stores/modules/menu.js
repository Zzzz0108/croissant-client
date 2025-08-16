import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'

/**
 * 主题设置
 */
export const MenuStore = defineStore({
  id: 'MenuStore',
  state: () => ({
    menuIndex: '1-0',
  }),
  actions: {
    setMenuIndex(menuIndex) {
      this.menuIndex = menuIndex
    },
  },
  persist: piniaPersistConfig('MenuStore'),
}) 