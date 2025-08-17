<script setup lang="js">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import Avatar from './components/avatar.vue'
import { useDark, useToggle } from '@vueuse/core'
import { themeStore } from '@/stores/modules/theme'

const route = useRoute()
const router = useRouter()
const currentIcon = ref('material-symbols:wb-sunny-outline-rounded')
const theme = themeStore()

const searchText = ref('')
const showSearchHistory = ref(false)
const searchHistory = ref([])
const maxSearchHistory = 10

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

const toggleMode = () => {
  theme.setDark(isDark.value)
  toggleDark()
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

// 从本地存储加载搜索历史
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('croissant_search_history')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        searchHistory.value = parsed.slice(0, maxSearchHistory)
      }
    }
  } catch (error) {
    console.warn('🎵 Header - 加载搜索历史失败:', error)
  }
}

// 保存搜索历史到本地存储
const saveSearchHistory = () => {
  try {
    localStorage.setItem('croissant_search_history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.warn('🎵 Header - 保存搜索历史失败:', error)
  }
}

// 添加搜索历史
const addSearchHistory = (query) => {
  if (!query || query.trim() === '') return
  
  const trimmedQuery = query.trim()
  
  // 移除重复的搜索记录
  const filteredHistory = searchHistory.value.filter(item => item !== trimmedQuery)
  
  // 添加到开头
  filteredHistory.unshift(trimmedQuery)
  
  // 限制历史记录数量
  if (filteredHistory.length > maxSearchHistory) {
    filteredHistory.splice(maxSearchHistory)
  }
  
  searchHistory.value = filteredHistory
  saveSearchHistory()
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  try {
    localStorage.removeItem('croissant_search_history')
  } catch (error) {
    console.warn('🎵 Header - 清除本地存储失败:', error)
  }
}

// 删除单个搜索历史
const removeSearchHistory = (index) => {
  searchHistory.value.splice(index, 1)
  saveSearchHistory()
}

// 选择搜索历史
const selectSearchHistory = (query) => {
  searchText.value = query
  showSearchHistory.value = false
  router.push('/library?query=' + query)
}

// 处理搜索
const handleSearch = () => {
  if (!searchText.value.trim()) return
  
  // 添加搜索历史
  addSearchHistory(searchText.value)
  
  // 跳转到曲库页面
  router.push('/library?query=' + searchText.value)
  showSearchHistory.value = false
}

// 赋值到搜索框
watch(
  () => route.query,
  (newValue) => {
    if (newValue.query) {
      searchText.value = newValue.query
    }
  },
  { immediate: true }
)

// 处理搜索框失焦
const handleSearchBlur = () => {
  // 延迟关闭，让用户有时间点击搜索历史
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

// 组件挂载时加载搜索历史
onMounted(() => {
  loadSearchHistory()
})
</script>
<template>
  <header class="px-4 py-2 border-b flex items-center justify-between">
    <!-- 左侧：Logo和应用名 -->
    <button class="flex relative w-60" @click="router.push('/')">
      <img src="\logo.svg" alt="logo" class="w-10 h-10 ml-2" />
      <span class="ml-3 text-2xl font-bold flex justify-center items-center app-name"
        >Croissant</span
      >
    </button>
    
    <!-- 中间：搜索框 -->
    <div class="flex-1 flex justify-center max-w-2xl mx-8">
      <div class="relative w-full max-w-md">
        <Icon
          icon="mdi:magnify"
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl z-10"
        />
        <input
          v-model="searchText"
          type="text"
          class="w-full text-sm pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 search-bg border border-gray-200 dark:border-gray-700"
          placeholder="搜索音乐、歌手、歌单..."
          @keyup.enter="handleSearch"
          @focus="showSearchHistory = true"
          @blur="handleSearchBlur"
        />
        
        <!-- 搜索历史下拉面板 -->
        <div 
          v-if="showSearchHistory && searchHistory.length > 0"
          class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">搜索历史</span>
              <button 
                @click="clearSearchHistory"
                class="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
          
          <div class="py-1">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center justify-between group"
              @click="selectSearchHistory(item)"
            >
              <div class="flex items-center gap-2">
                <Icon icon="mdi:clock-outline" class="text-gray-400 text-sm" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ item }}</span>
              </div>
              <button
                @click.stop="removeSearchHistory(index)"
                class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Icon icon="mdi:close" class="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧：主题切换和头像 -->
    <div class="flex items-center gap-3">
      <button @click="toggleMode" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
        <Icon class="text-xl" :icon="currentIcon" />
      </button>
      <Avatar />
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');

.search-bg {
  background-color: #e3e3e3;
}

.app-name {
  font-family: "Bricolage Grotesque", sans-serif;
}

</style>
