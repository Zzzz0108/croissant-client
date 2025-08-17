<script setup lang="js">
import Left from './left.vue'
import Right from './right.vue'
import { useDark, useToggle } from '@vueuse/core'
import { useDateFormat, useNow } from '@vueuse/core'
import { getSongDetail } from '@/api/system'
import { ref, provide, watch, inject, computed } from 'vue'
import { themeStore } from '@/stores/modules/theme'

const formatted = useDateFormat(useNow(), 'HH:mm:ss')
const theme = themeStore()
const showDrawer = defineModel()
const songDetail = ref(null)

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

// 初始化时检查并同步暗黑模式状态
console.log('🎵 DrawerMusic 初始化状态检查:', {
  themeIsDark: theme.isDark,
  isDarkValue: isDark.value,
  shouldSync: theme.isDark !== isDark.value
})

// 如果初始状态不同步，则同步
if (theme.isDark !== isDark.value) {
  console.log('🎵 DrawerMusic 初始化时同步状态')
  if (theme.isDark) {
    isDark.value = true
  } else {
    isDark.value = false
  }
}
const toggleMode = () => {
  // 修复暗黑模式逻辑：直接切换当前状态
  const newDarkMode = !theme.isDark
  theme.setDark(newDarkMode)
  
  // 同步 isDark 状态
  if (newDarkMode !== isDark.value) {
    toggleDark()
  }
  
  console.log('🎵 DrawerMusic 暗黑模式切换:', {
    oldMode: theme.isDark,
    newMode: newDarkMode,
    isDarkValue: isDark.value,
    themeIsDark: theme.isDark
  })
}

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const currentTrack = computed(() => {
  try {
    if (!audioPlayer) {
      console.warn('🎵 DrawerMusic: audioPlayer 未注入')
      return {}
    }
    
    // currentTrack 是一个 ComputedRef，需要调用 .value 获取实际值
    const track = audioPlayer.currentTrack?.value || {}
    
    console.log('🎵 DrawerMusic currentTrack 计算:', {
      hasAudioPlayer: !!audioPlayer,
      currentTrackRef: audioPlayer.currentTrack,
      track: track,
      trackKeys: track ? Object.keys(track) : []
    })
    
    return track
  } catch (error) {
    console.error('🎵 DrawerMusic currentTrack 计算错误:', error)
    return {}
  }
})

// 监听 currentTrack 的变化，获取歌曲详情
watch(() => currentTrack.value.trackId || currentTrack.value.id, async (newId) => {
  console.log('🎵 DrawerMusic 监听歌曲ID变化:', {
    trackId: currentTrack.value.trackId,
    id: currentTrack.value.id,
    newId: newId,
    currentTrack: currentTrack.value
  })
  
  if (newId && newId !== 'default') {
    try {
      const res = await getSongDetail(Number(newId))
      if (res.code === 0 && res.data) {
        // 确保返回的数据符合 SongDetail 接口
        const songData = res.data
        console.log('🎵 DrawerMusic 获取到歌曲详情:', songData)
        
        if (
          'songId' in songData &&
          'songName' in songData &&
          'artistName' in songData &&
          'album' in songData
        ) {
          songDetail.value = songData
          console.log('🎵 DrawerMusic 歌曲详情设置成功:', {
            songId: songData.songId,
            songName: songData.songName,
            artistName: songData.artistName,
            coverUrl: songData.coverUrl,
            hasCoverUrl: !!songData.coverUrl,
            fullSongData: songData
          })
        } else {
          console.error('歌曲详情数据格式不正确:', songData)
        }
      } else {
        console.warn('获取歌曲详情失败:', res)
      }
    } catch (error) {
      console.error('获取歌曲详情失败:', error)
    }
  } else {
    console.log('🎵 DrawerMusic 歌曲ID无效或为默认值，跳过详情获取')
    songDetail.value = null
  }
}, { immediate: true })

// 提供 songDetail 给子组件
provide('songDetail', songDetail)

// 监听主题状态变化，确保同步
watch(() => theme.isDark, (newDarkMode) => {
  console.log('🎵 DrawerMusic 主题状态变化:', {
    newDarkMode,
    isDarkValue: isDark.value,
    shouldSync: newDarkMode !== isDark.value
  })
  
  // 如果主题状态与 isDark 不同步，则同步
  if (newDarkMode !== isDark.value) {
    console.log('🎵 DrawerMusic 同步 isDark 状态')
    if (newDarkMode) {
      isDark.value = true
    } else {
      isDark.value = false
    }
  }
}, { immediate: true })
</script>
<template>
  <el-drawer :style="{
    '--track-cover-url': currentTrack.cover ? `url(${currentTrack.cover})` : 'none',
  }" v-model="showDrawer" direction="btt" size="100%" :modal="false" :showClose="false"
    class="drawer-bg backdrop-filter backdrop-blur-md">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-center gap-2 text-primary-foreground">
          <el-button text circle @click="showDrawer = false">
            <icon-uiw:down />
          </el-button>
        </div>
        <div class="flex items-center gap-1">
          <icon-meteor-icons:clock />
          <span class="text-base"> {{ formatted }} </span>
        </div>
      </div>
    </template>
    <main class="flex h-full">
      <div class="flex w-full flex-1">
        <div class="w-1/2">
          <Left v-if="songDetail" />
          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <p>暂无歌曲信息</p>
          </div>
        </div>
        <div class="w-1/2 relative">
          <Right v-if="songDetail" />
          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            <p>暂无歌曲详情</p>
          </div>
        </div>
      </div>
    </main>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-switch 
          :model-value="theme.isDark" 
          @update:model-value="toggleMode" 
          active-text="暗黑模式" 
        />
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-bg {
  background-image: var(--track-cover-url);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.drawer-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  z-index: -1;
}
</style>
