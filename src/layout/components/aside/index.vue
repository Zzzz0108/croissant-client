<script setup lang="js">
import { MenuData } from './data'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import { UserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'
import AuthTabs from '@/components/Auth/AuthTabs.vue'
import { useFavoriteStore } from '@/stores/modules/favorite'

const route = useRoute()
const router = useRouter()
const user = UserStore()
const favoriteStore = useFavoriteStore()
const authVisible = ref(false)

// 处理需要登录的路由
const handleProtectedRoute = (path) => {
  if (!user.isLoggedIn && (path === '/like' || path === '/user')) {
    ElMessage.warning('请先登录')
    authVisible.value = true
    return false
  }
  return true
}

// 监听用户登录状态
watch(
  () => user.isLoggedIn,
  (newVal) => {
    if (newVal) {
      favoriteStore.getFavoritePlaylists()
    } else {
      favoriteStore.clearFavoritePlaylists()
    }
  },
  { immediate: true }
)
</script>

<template>
  <aside class="w-64 hidden h-full md:block border-r shadow-2xl shadow-blue-500/50">
    <!-- 移除 overflow-hidden，让内容可以滚动 -->
    <nav class="flex flex-col h-full">
      
      <!-- 固定高度的菜单区域 -->
      <div class="flex-shrink-0 p-4 space-y-4">
        <div v-for="(item, index) in MenuData" :key="index" class="w-full flex flex-col gap-1">
          <h3 class="ml-4 text-sm font-semibold text-inactive">
            {{ item.title }}
          </h3>
          <div v-for="(item2, index2) in item.children" :key="index2"
            class="mx-2 rounded-lg transition text-lg duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer"
            :class="{
              'bg-activeMenuBg': route.path === item2.router,//当前路由与菜单项路由匹配时，添加背景色
              'hover:bg-hoverMenuBg': true,//鼠标悬停时，添加背景色
            }" @click="handleProtectedRoute(item2.router) && router.push(item2.router)">
            <Icon :icon="item2.icon" />
            <span>{{ item2.title }}</span>
            <span class="ml-auto text-xs text-primary-foreground bg-emphasis border-border p-1 rounded-lg"></span>
          </div>
        </div>
      </div>

      <!-- 收藏的歌单 - 可滚动区域 -->
      <div class="flex-1 min-h-0 p-4" v-if="user.isLoggedIn">
        <h3 class="ml-4 text-sm font-semibold text-inactive mb-4">
          收藏的歌单（{{ favoriteStore.favoritePlaylists.length }}）
        </h3>
        
        <!-- 滚动区域 -->
        <div class="overflow-y-auto h-full">
          <el-skeleton :loading="favoriteStore.loading" animated :count="favoriteStore.favoritePlaylists.length" v-if="favoriteStore.loading">
            <template #template>
              <div class="flex items-center space-x-2 p-2 mx-2">
                <el-skeleton-item variant="image" style="width: 28px; height: 28px" />
                <el-skeleton-item variant="text" style="width: 130px" />
              </div>
            </template>
          </el-skeleton>

          <template v-else>
            <div v-for="item in favoriteStore.favoritePlaylists" :key="item.id"
              class="mx-2 my-1 rounded-lg transition text-sm duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer"
              :class="{
                'bg-activeMenuBg': route.path === `/playlist/${item.id}`,
                'hover:bg-hoverMenuBg':true,
              }" @click="router.push(`/playlist/${item.id}`)">
              <el-image lazy :src="item.coverImgUrl + '?param=50y50'" class="w-10 h-10 rounded-md flex-shrink-0"
                :alt="item.name" />
              <div class="flex-1 min-w-0">
                <span class="line-clamp-2 text-sm leading-normal">{{ item.name }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </nav>

    <!-- 登录对话框 -->
    <AuthTabs v-model="authVisible" />
  </aside>
</template>
