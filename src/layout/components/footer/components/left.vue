<script setup lang="js">
import { ref, inject, computed, watch } from 'vue'
import DrawerMusic from '@/components/DrawerMusic/index.vue'
import { processImageUrl } from '@/utils/minio'

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const currentTrack = computed(() => {
  try {
    if (!audioPlayer) {
      console.warn('🎵 Footer: audioPlayer 未注入')
      return {}
    }
    
    // 检查 audioPlayer 的完整结构
    console.log('🎵 Footer audioPlayer 结构:', {
      hasAudioPlayer: !!audioPlayer,
      audioPlayerKeys: audioPlayer ? Object.keys(audioPlayer) : [],
      currentTrack: audioPlayer.currentTrack,
      trackList: audioPlayer.trackList,
      currentSongIndex: audioPlayer.currentSongIndex,
      isPlaying: audioPlayer.isPlaying
    })
    
    // currentTrack 是一个 ComputedRef，需要调用 .value 获取实际值
    const track = audioPlayer.currentTrack?.value || {}
    
    // 如果 currentTrack 为空，尝试从 trackList 获取
    if (!track || Object.keys(track).length === 0) {
      if (audioPlayer.trackList && audioPlayer.trackList.length > 0) {
        const currentIndex = audioPlayer.currentSongIndex || 0
        const currentTrackFromList = audioPlayer.trackList[currentIndex]
        console.log('🎵 Footer 从 trackList 获取当前歌曲:', {
          currentIndex,
          currentTrackFromList,
          trackListLength: audioPlayer.trackList.length
        })
        return currentTrackFromList || {}
      }
    }
    
    // 确保返回的字段与模板期望的一致
    const result = {
      title: track.title || '未选择歌曲',
      artist: track.artist || '未知歌手',
      cover: track.cover || '',
      trackId: track.trackId || track.id || 'default',
      hasCover: !!(track.cover && track.cover !== '')
    }
    
    console.log('🎵 Footer 最终返回的 currentTrack:', result)
    return result
  } catch (error) {
    console.error('🎵 Footer currentTrack 计算错误:', error)
    return {}
  }
})
const showDrawerMusic = ref(false)

// 处理点击事件
const handleClick = () => {
  console.log('🎵 Footer 点击事件触发:', {
    currentTrack: currentTrack.value,
    showDrawerMusic: showDrawerMusic.value
  })
  showDrawerMusic.value = !showDrawerMusic.value
  console.log('🎵 Footer 抽屉状态切换为:', showDrawerMusic.value)
}

// 图片加载处理
const handleImageError = (event) => {
  console.error('图片加载失败:', {
    src: event.target.src,
    currentTrack: currentTrack.value,
    cover: currentTrack.value?.cover
  })
  // 设置默认图片
  event.target.src = '/src/assets/default_album.jpg'
}

const handleImageLoad = () => {
  console.log('图片加载成功:', currentTrack.value?.cover)
}

// 调试信息：监听currentTrack变化
watch(currentTrack, (newTrack) => {
  try {
    if (newTrack && Object.keys(newTrack).length > 0) {
      console.log('🎵 Footer currentTrack 更新:', {
        title: newTrack.title,
        cover: newTrack.cover,
        hasCover: !!newTrack.cover,
        trackId: newTrack.id,
        artist: newTrack.artist
      })
    } else {
      console.log('🎵 Footer currentTrack 为空或无效')
    }
  } catch (error) {
    console.error('🎵 Footer currentTrack watch 错误:', error)
  }
}, { immediate: true, deep: true })
</script>

<template>
  <div 
    class="flex items-center gap-2 w-64 cursor-pointer select-none hover:bg-hoverMenuBg transition-colors rounded-lg p-1" 
    @click="handleClick"
  >
    <!-- 调试信息 -->
    <div v-if="!currentTrack.cover" class="text-xs text-red-500">
      无封面: {{ currentTrack.title || '未知歌曲' }}
    </div>
    <div class="min-w-12 max-w-12 h-full">
      <img
        :src="processImageUrl(currentTrack.cover, '90y90') || '/src/assets/default_album.jpg'"
        :alt="currentTrack.title || '未知歌曲'"
        class="w-full h-full object-cover rounded-lg m-1"
        @error="handleImageError"
        @load="handleImageLoad"
      />
    </div>
    <div>
      <div
        class="text-base text-primary-foreground line-clamp-1 mb-0.5 mx-2"
        :title="currentTrack.title"
      >
        {{ currentTrack.title }}
      </div>
      <div class="text-xs text-muted-foreground line-clamp-1 h-4 mt-0.5 mx-2">
        {{ currentTrack.artist }}
      </div>
    </div>
    <DrawerMusic v-model="showDrawerMusic" />
  </div>
</template>
