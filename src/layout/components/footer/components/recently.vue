<script setup lang="js">
import { ref, inject } from 'vue'
import { formatMillisecondsToTime } from '@/utils'
import { trackModel } from '@/stores/interface'
import { AudioStore } from '@/stores/modules/audio'

const audio = AudioStore()

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const { loadTrack, play, audioElement } = audioPlayer || {}

const mouseOverIndex = ref(-1) // 用于跟踪鼠标悬停的索引

const playMusic = async (song) => {
  // 找到歌曲在播放列表中的索引
  const songIndex = audio.trackList.findIndex(track => track.id === song.id)
  
  if (songIndex !== -1) {
    // 1. 先停止当前播放
    if (audioPlayer && audioPlayer.pause) {
      audioPlayer.pause()
    }
    
    // 2. 更新播放索引
    audio.currentSongIndex = songIndex
    
    // 3. 等待一小段时间，确保停止完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 4. 加载新歌曲
    if (audioPlayer && audioPlayer.loadTrack) {
      await audioPlayer.loadTrack()
    }
    
    // 5. 再等待一小段时间，确保加载完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 6. 开始播放
    if (audioPlayer && audioPlayer.play) {
      await audioPlayer.play()
    }
  }
}

const handleClearAll = () => {
  audio.setAudioStore('trackList', [])
  if (audioElement.value) {
    audioElement.value.src = ''
  }
}
</script>
<template>
  <el-popover :width="450" trigger="click" placement="top-end" popper-class="rounded-lg p-0">
    <template #reference>
      <div class="flex items-center">
        <button class="p-2 rounded-full hover:bg-hoverMenuBg transition w-9">
          <icon-ri-play-list-2-fill class="w-full h-full" />
        </button>
      </div>
    </template>
    <div class="bg-popoverBg rounded-lg p-2">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">播放列表</span>
        <button class="p-2 rounded-full hover:bg-hoverMenuBg transition" @click="handleClearAll">
          <icon-material-symbols:delete-outline-rounded class="text-sm text-gray-500" />
        </button>
      </div>
      <div class="flex flex-col">
        <el-scrollbar class="h-96">
          <div v-for="(item, index) in audio.trackList" :key="index" @click="playMusic(item)"
            @mouseover="mouseOverIndex = index" @mouseleave="mouseOverIndex = -1"
            class="flex items-center gap-2 p-2 my-1 rounded-lg transition group cursor-pointer"
            :class="`hover:bg-gray-300 ${audio.currentSongIndex == index ? 'bg-gray-300 dark:bg-[#414243]' : ''} dark:hover:bg-[#414243] `">
            <div class="w-10 h-auto rounded-lg overflow-hidden relative">
              <img :src="item.cover" alt="" />
              <!-- Play 按钮，使用 group-hover 控制透明度 -->
              <div
                class="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-300 z-10 group-hover:opacity-100 group-hover:bg-black/50 rounded-md">
                <icon-tabler:player-play-filled class="text-lg" />
              </div>
            </div>
            <div class="flex-1">
              <div class="text-sm">{{ item.title }}</div>
              <div class="text-xs text-gray-400">{{ item.artist }}</div>
            </div>
            <div class="text-xs text-gray-400">
              {{ formatMillisecondsToTime(Number(item.duration) * 1000) }}
            </div>
            <el-button v-show="mouseOverIndex == index" type="primary" text circle @click="audio.deleteTrack(item.id)">
              <icon-material-symbols:delete-outline-rounded class="text-lg text-gray-500" />
            </el-button>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </el-popover>
</template>
