<script setup lang="js">
import { useRouter } from 'vue-router'
import Avatar from './components/avatar.vue'
import Search from './components/search.vue'
import ThemeToggle from './components/theme-toggle.vue'

const router = useRouter()
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
    <Search />
    
    <!-- 右侧：主题切换和头像 -->
    <div class="flex items-center gap-3">
      <ThemeToggle />
      <Avatar />
    </div>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap');

.app-name {
  font-family: "Bricolage Grotesque", sans-serif;
}
</style>
