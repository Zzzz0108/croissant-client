<script setup lang="js">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { categories } from '@/utils/enum'
import { getAllArtists } from '@/api/system'
import { ElNotification } from 'element-plus'
import { processImageUrls } from '@/utils/minio'
import { Icon } from '@iconify/vue'

const router = useRouter()
const artistList = ref([])

const selectedGender = ref('-1')
const selectedArea = ref('-1')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(16) // 默认显示16个歌手
const total = ref(0)

const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [16, 24, 36, 48], // 16作为第一个选项
})

const searchKeyword = ref('')

// 切换菜单显示
const toggleMenu = (index) => {
  categories.value[index].isOpen = categories.value[index].isOpen
}

// 处理分页大小变化
const handleSizeChange = () => {
  currentPage.value = 1
  handleGetArtistList()
}

// 处理页码变化
const handleCurrentChange = () => {
  handleGetArtistList()
}

const handleSubCategoryClick = (id, index) => {
  if (index === 0) {
    selectedGender.value = id
  } else {
    selectedArea.value = id
  }
  currentPage.value = 1
  handleGetArtistList()
}

const handleGetArtistList = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    name: null,
    gender: selectedGender.value === '-1' ? null : categories.value[0].subCategories.find(item => item.id === selectedGender.value)?.value,
    area: selectedArea.value === '-1' ? null : categories.value[1].subCategories.find(item => item.id === selectedArea.value)?.value
  }

  getAllArtists(params).then((res) => {
    if (res.code === 0 && res.data) {
      console.log('获取歌手数据原始响应:', res.data)
      
      // 处理图片 URL，添加 -blob 后缀
      const processedItems = processImageUrls(res.data.items || [], '230y230')
      console.log('处理后的歌手数据:', processedItems)
      
      artistList.value = processedItems.map(item => ({
        artistId: item.artistId,
        name: item.artistName,
        picUrl: item.avatar,
        alias: []
      }))
      
      console.log('最终歌手列表:', artistList.value)
      total.value = res.data.total
      state.total = res.data.total
    } else {
      ElNotification({
        type: 'error',
        message: '获取歌手列表失败',
        duration: 2000,
      })
    }
  })
}

// 重置筛选条件
const handleReset = () => {
  selectedGender.value = '-1'
  selectedArea.value = '-1'
  searchKeyword.value = ''
  currentPage.value = 1
  handleGetArtistList()
}

const handleSearch = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    artistName: searchKeyword.value || null,
    gender: selectedGender.value === '-1' ? null : categories.value[0].subCategories.find(item => item.id === selectedGender.value)?.value,
    area: selectedArea.value === '-1' ? null : categories.value[1].subCategories.find(item => item.id === selectedArea.value)?.value
  }

  getAllArtists(params).then((res) => {
    if (res.code === 0 && res.data) {
      // 处理图片 URL，添加 -blob 后缀
      const processedItems = processImageUrls(res.data.items || [], '230y230')
      
      artistList.value = processedItems.map(item => ({
        artistId: item.artistId,
        name: item.artistName,
        picUrl: item.avatar,
        alias: []
      }))
      total.value = res.data.total
      state.total = res.data.total
    } else {
      ElNotification({
        type: 'error',
        message: '获取歌手列表失败',
        duration: 2000,
      })
    }
  })
}



onMounted(() => {
  handleGetArtistList()
})
</script>
<template>
  <div class="flex h-full overflow-hidden p-4 gap-4">
    <!-- 左侧固定区域：歌手分类和搜索栏 -->
    <div class="w-64 bg-white/50 dark:bg-gray-800/50 p-4 flex-shrink-0 border-r border-border rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 backdrop-blur-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">歌手分类</h2>
        <button @click="handleReset"
          class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <icon-bx:reset class="mr-1 h-4 w-4" />
          重置
        </button>
      </div>

      <nav class="space-y-4">
        <!-- 搜索框 -->
        <div class="relative">
          <icon-akar-icons:search
            class="lucide lucide-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" />
          <input v-model="searchKeyword" @keyup.enter="handleSearch"
            class="flex h-10 rounded-lg border border-input transform duration-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 pl-10 w-full"
            placeholder="搜索歌手" />
        </div>

        <!-- 性别分类 -->
        <div class="space-y-2">
          <button
            class="inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            @click="toggleMenu(0)">
            {{ categories[0].name }}
            <icon-tabler:chevron-right :style="{
              transform: categories[0].isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }" />
          </button>
          <div v-show="categories[0].isOpen" class="ml-4 space-y-1">
            <button v-for="(subCategory, subIndex) in categories[0].subCategories" :key="subIndex"
              @click="handleSubCategoryClick(subCategory.id, 0)"
              class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-start"
              :class="selectedGender === subCategory.id ? 'bg-activeMenuBg text-accent-foreground' : 'hover:bg-hoverMenuBg text-foreground'">
              {{ subCategory.label }}
            </button>
          </div>
        </div>
        
        <!-- 地区分类 -->
        <div class="space-y-2">
          <button
            class="inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            @click="toggleMenu(1)">
            {{ categories[1].name }}
            <icon-tabler:chevron-right :style="{
              transform: categories[1].isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }" />
          </button>
          <div v-show="categories[1].isOpen" class="ml-4 space-y-1">
            <button v-for="(subCategory, subIndex) in categories[1].subCategories" :key="subIndex"
              @click="handleSubCategoryClick(subCategory.id, 1)"
              class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 rounded-md px-3 w-full justify-start"
              :class="selectedArea === subCategory.id ? 'bg-activeMenuBg text-accent-foreground' : 'hover:bg-hoverMenuBg text-foreground'">
              {{ subCategory.label }}
            </button>
          </div>
        </div>
      </nav>
    </div>
    
    <!-- 右侧可滚动区域：歌手列表 -->
    <main class="flex-1 overflow-hidden flex flex-col">
      <!-- 歌手列表容器 -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-6xl mx-auto">
          <!-- 歌手网格 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            <div v-for="(artist, index) in artistList" :key="index"
              class="group relative rounded-full text-card-foreground shadow-md hover:shadow-xl transition-all duration-300">
              <button @click="router.push(`/artist/${artist.artistId}`)" class="w-full h-full overflow-hidden rounded-full">
                <div class="w-full h-full relative">
                  <el-image lazy :alt="artist.name"
                    class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    :src="artist.picUrl + '?param=230y230'" />
                  <div
                    class="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  </div>
                  <div
                    class="absolute bottom-0 left-0 right-0 px-4 py-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                    <h2 class="mb-1 text-xl font-semibold">{{ artist.name }}</h2>
                    <p class="mb-2 text-sm" v-if="artist.alias && artist.alias.length > 0">
                      {{ artist.alias.join() }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="artistList.length === 0" class="text-center py-16">
            <div class="text-gray-500 dark:text-gray-400">
              <icon-mdi:account-music class="text-6xl mx-auto mb-4 opacity-50" />
              <p class="text-lg">暂无歌手数据</p>
              <p class="text-sm mt-2">请尝试调整筛选条件或搜索关键词</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页器 -->
      <div class="border-t border-border bg-background px-4">
        <nav class="flex justify-center">
          <el-pagination 
            v-model:page-size="pageSize" 
            v-model:currentPage="currentPage" 
            v-bind="state"
            @size-change="handleSizeChange" 
            @current-change="handleCurrentChange" 
            class="flex-shrink-0"
          />
        </nav>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 暗黑模式滚动条 */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 歌手头像悬停效果 */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

/* 响应式网格优化 */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 769px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}
</style>
