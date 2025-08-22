<script setup lang="js">
import { ref, computed, inject, watch } from 'vue'
import { Icon } from '@iconify/vue'
import Recently from './recently.vue'
import { AudioStore } from '@/stores/modules/audio'

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const { setVolume, setPlayMode } = audioPlayer || {}

// 获取音频状态
const audio = AudioStore()

// 使用 ref 而不是 computed，这样可以修改
const volume = ref(audio.volume)

// 监听 volume 变化，同步到 store 和播放器
watch(volume, (newVolume) => {
  // 同步到 store
  audio.setAudioStore('volume', newVolume)
  
  // 同步到播放器
  if (audioPlayer && audioPlayer.setVolume) {
    audioPlayer.setVolume(newVolume)
  }
  
  // 同步到音频元素
  if (audioPlayer && audioPlayer.audioElement && audioPlayer.audioElement.value) {
    audioPlayer.audioElement.value.volume = newVolume / 100
  }
  
  // 如果不是静音状态，更新 lastVolume
  if (newVolume > 0) {
    audio.setAudioStore('lastVolume', newVolume)
  }
}, { immediate: true })

// 监听 store 变化，同步到本地（避免循环更新）
watch(() => audio.volume, (newVolume) => {
  // 只有当值不同时才更新，避免循环
  if (volume.value !== newVolume) {
    volume.value = newVolume
  }
})

const isMuted = computed(() => volume.value === 0)

const toggleVolume = () => {
  // 切换静音状态
  if (volume.value > 0) {
    // 保存当前音量，然后静音
    audio.setAudioStore('lastVolume', volume.value)
    volume.value = 0
  } else {
    // 恢复到之前保存的音量，如果没有则使用默认值
    const lastVolume = audio.lastVolume || 50
    volume.value = lastVolume
  }
}

// 添加播放模式相关逻辑
const playModes = {
  order: {
    icon: 'ri:order-play-line',
    next: 'shuffle',
    tooltip: '顺序播放'
  },
  shuffle: {
    icon: 'ri:shuffle-line',
    next: 'loop',
    tooltip: '随机播放'
  },
  loop: {
    icon: 'ri:repeat-2-line',
    next: 'single',
    tooltip: '列表循环'
  },
  single: {
    icon: 'ri:repeat-one-line',
    next: 'order',
    tooltip: '单曲循环'
  }
}

// 使用 store 中的播放模式
const currentMode = computed(() => audio.playMode)

const togglePlayMode = () => {
  const nextMode = playModes[currentMode.value].next
  setPlayMode(nextMode)
}
</script>
<template>
  <div class="flex items-center pr-4">
    <div class="flex items-center mx-4">
      <el-tooltip :content="playModes[currentMode].tooltip" placement="top" effect="dark">
        <button class="p-2 rounded-full hover:bg-hoverMenuBg transition w-9 h-9" @click="togglePlayMode">
          <Icon :icon="playModes[currentMode].icon" class="w-full h-full" />
        </button>
      </el-tooltip>
    </div>
    <button @click="toggleVolume" class="p-2 rounded-full hover:bg-hoverMenuBg transition w-9 h-9">
      <Icon :icon="isMuted ? 'ic:round-volume-off' : 'ic:round-volume-up'" class="w-full h-full" />
    </button>
    <el-slider v-model="volume" :show-tooltip="false" class="w-24 mr-4" size="small" :max="100" />
    <Recently />
  </div>
</template>
<style lang="scss">
.el-slider__button-wrapper {
  display: none important;
}
</style>
