<script setup lang="js">
import Left from './left.vue'
import Right from './right.vue'
import { useDateFormat, useNow } from '@vueuse/core'
import { getSongDetail } from '@/api/system'
import { ref, provide, watch, inject, computed } from 'vue'

const formatted = useDateFormat(useNow(), 'HH:mm:ss')
const showDrawer = defineModel()
const songDetail = ref(null)

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
      <!-- 移除主题切换开关，保持与主界面一致 -->
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
