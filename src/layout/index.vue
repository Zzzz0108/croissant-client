<script setup lang="js">
import Header from './components/header/index.vue'
import Aside from './components/aside/index.vue'
import Main from './components/main/index.vue'
import Footer from './components/footer/index.vue'
// import BG from './components/bg/index.vue'
import { provide } from 'vue'
import { AudioPlayer } from '@/hooks/useAudioPlayer'

provide('audioPlayer', AudioPlayer())
//在顶层提供音频播放器实例，供子组件使用，因为子组件都可能需要使用音频播放器，而且需要保持状态同步
//父组件用provide提供，子组件用inject注入
//audioPlayer是key，作为名字供子组件使用，AudioPlayer()是value，AudioPlayer()返回一个对象，对象中包含音频播放器实例
</script>
<template>
  <!-- <BG /> -->
  <div class="absolute w-full flex flex-col h-full">
    <div
      class="w-full flex flex-col h-full overflow-hidden bg-themeBgColor backdrop-blur-lg"
    >
      <Header />
      <div class="flex flex-1 overflow-hidden">
        <Aside />
        <Main />
      </div>
      <Footer />
    </div>
  </div>
</template>
