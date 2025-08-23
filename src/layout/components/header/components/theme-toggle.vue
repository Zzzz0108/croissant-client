<script setup lang="js">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useDark, useToggle } from '@vueuse/core'
import { themeStore } from '@/stores/modules/theme'

const currentIcon = ref('material-symbols:wb-sunny-outline-rounded')
const theme = themeStore()

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

const toggleMode = () => {
  // 修复：先切换 store 状态，再同步 isDark
  const newDarkMode = !theme.isDark
  theme.setDark(newDarkMode)
  
  // 如果 isDark 状态与 store 不一致，则同步
  if (newDarkMode !== isDark.value) {
    toggleDark()
  }
}

// 初始化时根据 store 设置图标
watch(
  () => theme.isDark,
  (newValue) => {
    currentIcon.value = newValue
      ? 'mdi:weather-night'
      : 'material-symbols:wb-sunny-outline-rounded'
  },
  { immediate: true }
)

// 监听 isDark 变化，确保与 store 同步
watch(
  () => isDark.value,
  (newValue) => {
    if (newValue !== theme.isDark) {
      theme.setDark(newValue)
    }
  }
)
</script>

<template>
  <button @click="toggleMode" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
    <Icon class="text-xl" :icon="currentIcon" />
  </button>
</template> 