<script setup lang="js">
import { formatTime } from '@/utils'
import { processImageUrl } from '@/utils/minio'
import { Icon } from '@iconify/vue'
import { ref, inject, computed } from 'vue'
import vinylImg from '@/assets/vinyl.png'
import Recently from '../../layout/components/footer/components/recently.vue'

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const {
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  nextTrack,
  prevTrack,
  togglePlayPause,
  seek,
  setPlayMode,
} = audioPlayer || {}

const songDetail = inject('songDetail')

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

const currentMode = ref('order')

const togglePlayMode = () => {
  const nextMode = playModes[currentMode.value].next
  currentMode.value = nextMode
  setPlayMode(nextMode)
}

// 封面URL计算属性
const coverUrl = computed(() => {
  try {
    // 优先使用 songDetail 的封面
    if (songDetail?.value?.coverUrl) {
      const rawUrl = songDetail.value.coverUrl
      console.log('🎵 DrawerMusic 计算属性 - 原始 songDetail 封面:', rawUrl)
      
      // 使用 processImageUrl 处理封面URL，移除 -blob 后缀并添加尺寸参数
      const processedUrl = processImageUrl(rawUrl, '350y350')
      console.log('🎵 DrawerMusic 计算属性 - 处理后的 songDetail 封面:', processedUrl)
      
      return processedUrl
    }
    
    // 其次使用 currentTrack 的封面
    if (currentTrack?.cover) {
      const rawUrl = currentTrack.cover
      console.log('🎵 DrawerMusic 计算属性 - 原始 currentTrack 封面:', rawUrl)
      
      // 使用 processImageUrl 处理封面URL
      const processedUrl = processImageUrl(rawUrl, '350y350')
      console.log('🎵 DrawerMusic 计算属性 - 处理后的 currentTrack 封面:', processedUrl)
      
      return processedUrl
    }
    
    // 最后使用默认封面
    console.log('🎵 DrawerMusic 计算属性 - 使用默认封面')
    return '/src/assets/default_album.jpg'
  } catch (error) {
    console.error('🎵 DrawerMusic 计算属性 - 获取封面URL错误:', error)
    return '/src/assets/default_album.jpg'
  }
})

// 这些函数不再需要，因为我们现在使用 processImageUrl 处理URL

// 获取封面URL（保持向后兼容）
const getCoverUrl = () => coverUrl.value

// 处理封面加载错误
const handleCoverError = (event) => {
  console.error('🎵 DrawerMusic 封面加载失败:', {
    target: event.target,
    style: event.target.style.backgroundImage,
    songDetail: songDetail.value,
    currentTrack: currentTrack
  })
  
  // 设置默认封面
  event.target.style.backgroundImage = 'url(/src/assets/default_album.jpg)'
}

// 处理封面加载成功
const handleCoverLoad = (event) => {
  console.log('🎵 DrawerMusic 封面加载成功:', {
    target: event.target,
    style: event.target.style.backgroundImage,
    computedStyle: window.getComputedStyle(event.target).backgroundImage
  })
}
</script>

<template>
  <div class="w-full h-[calc(80vh-8rem)] relative inset-0 px-4 flex flex-col items-center">
    <div class="flex flex-1 flex-col gap-4 items-center justify-center w-full">
      <!-- 封面 -->
      <div :class="` ${isPlaying ? 'is-playing' : ''}`">
        <div class="album">
          <div class="album-art rounded-md" :style="{
            backgroundImage: `url(${getCoverUrl()})`
          }" @error="handleCoverError" @load="handleCoverLoad"></div>
          <div class="vinyl" :style="{
            animationPlayState: isPlaying ? 'running' : 'paused',
            backgroundImage: `url(${vinylImg}), url(${getCoverUrl()})`
          }"></div>
        </div>
      </div>
      <!-- 标题类 -->
      <div class="flex flex-col items-center gap-2 mt-10">
        <h2 class="text-3xl font-bold text-primary-foreground">
          {{ songDetail?.songName || currentTrack.title }}
        </h2>
        <p class="text-xl text-inactive">{{ songDetail?.artistName || currentTrack.artist }}</p>
      </div>
      <!-- 控制区 -->
      <div class="flex gap-2 w-full items-center justify-center mt-8">
        <div class="flex items-center gap-2 w-2/4">
          <span class="text-xs w-10 text-foreground/50 text-center">{{
            formatTime(currentTime)
          }}</span>
          <el-slider v-model="currentTime" :show-tooltip="false" @change="seek" :max="duration" class="flex-1"
            size="small" />
          <span class="text-xs w-10 text-foreground/50 text-center">{{
            formatTime(duration)
          }}</span>
        </div>
      </div>
      <div class="flex items-center justify-center gap-14 w-2/4 mt-12">
        <el-tooltip :content="playModes[currentMode].tooltip" placement="top" effect="dark">
          <el-button text circle @click="togglePlayMode">
            <Icon :icon="playModes[currentMode].icon" class="text-2xl" />
          </el-button>
        </el-tooltip>
        <el-button text circle class="p-3" @click="prevTrack">
          <icon-solar:skip-previous-bold class="text-2xl" />
        </el-button>
        <el-button text circle class="p-3" @click="togglePlayPause">
          <Icon
            :icon="isPlaying ? 'ic:round-pause-circle' : 'material-symbols:play-circle'"
            class="text-7xl"
            :color="'#2a68fa'"
          />
        </el-button>
        <el-button text circle class="p-3" @click="nextTrack">
          <icon-solar:skip-previous-bold class="scale-x-[-1] text-2xl" />
        </el-button>
        <el-button text circle class="scale-125 text-primary-foreground">
          <Recently />
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.album {
  box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.65);
  height: 100%;
  position: relative;
  width: 100%;
  z-index: 10;
  border-radius: 8px;
}

.album-art {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  height: 315px;
  position: relative;
  width: 325px;
  z-index: 10;
}

.vinyl {
  animation: spin 2s linear infinite;
  transition: all 500ms;
  background-position: center, center;
  background-size: cover, 40% auto;
  background-repeat: no-repeat;
  border-radius: 100%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  height: 300px;
  left: 5%;
  position: absolute;
  top: 8px;
  width: 300px;
  z-index: 5;
  will-change: transform, left;

  .is-playing & {
    left: 52%;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
