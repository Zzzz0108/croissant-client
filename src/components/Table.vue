<script setup lang="js">
import { watch, inject, computed, onUnmounted, ref } from 'vue'
import { formatMillisecondsToTime } from '@/utils'
import default_album from '@/assets/default_album.jpg'
import { collectSong, cancelCollectSong } from '@/api/system'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'
import { AudioStore } from '@/stores/modules/audio'
import { processImageUrl } from '@/utils/minio'

const audio = AudioStore()
const userStore = UserStore()

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const { loadTrack, play } = audioPlayer || {}

// 添加播放状态的响应式引用，增加安全检查
const isPlaying = computed(() => {
  try {
    return audioPlayer?.isPlaying?.value || false
  } catch (error) {
    console.warn('🎵 Table组件 - 获取播放状态失败:', error)
    return false
  }
})

const currentTrackId = computed(() => {
  try {
    if (audioPlayer?.currentTrack?.value) {
      return audioPlayer.currentTrack.value.id
    }
    return null
  } catch (error) {
    console.warn('🎵 Table组件 - 获取当前歌曲ID失败:', error)
    return null
  }
})

  const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['play', 'like-updated'])

// 组件卸载标志
let isComponentMounted = ref(true)

// 监听数据变化，更新当前页面的歌曲列表
watch(() => props.data, (newData) => {
  if (isComponentMounted.value) {
    audio.setCurrentPageSongs(newData)
  }
}, { immediate: true })

// 组件卸载时设置标志
onUnmounted(() => {
  isComponentMounted.value = false
})

// 转换歌曲实体
const convertToTrackModel = (song) => {
  // console.log('原始歌曲数据:', song)
  if (!song || !song.songId || !song.songName || !song.audioUrl) {
    console.error('歌曲数据不完整:', song)
    return null
  }
  return {
    id: song.songId.toString(),
    title: song.songName,
    artist: song.artistName,
    album: song.album,
    cover: song.coverUrl ? processImageUrl(song.coverUrl, '350y350') : default_album,
    url: song.audioUrl,
    duration: Number(song.duration) || 0,
    likeStatus: song.likeStatus || 0,
  }
}

// 播放音乐
const handlePlay = async (row) => {
  try {
    if (!isComponentMounted.value) {
      console.warn('🎵 Table组件 - 组件已卸载，忽略播放操作')
      return
    }

    // 先将所有表格数据转换为 trackModel
    const allTracks = props.data
      .map(song => convertToTrackModel(song))
      .filter(track => track != null)  // 修复：过滤掉 null 值

    // 找到当前选中歌曲的索引
    const selectedIndex = props.data.findIndex(song => song.songId === row.songId)

    // 清空现有播放列表并添加所有歌曲
    audio.setAudioStore('trackList', allTracks)
    // 设置当前播放索引为选中的歌曲
    audio.setAudioStore('currentSongIndex', selectedIndex)

    // 加载并播放选中的歌曲
    if (loadTrack && play) {
      await loadTrack()
      play()
    } else {
      console.warn('🎵 Table组件 - loadTrack 或 play 函数未注入')
    }
  } catch (error) {
    console.error('🎵 Table组件 - 播放音乐失败:', error)
  }
}

// 更新所有相同歌曲的喜欢状态
const updateAllSongLikeStatus = (songId, status) => {
  console.log(`🔄 更新歌曲 ${songId} 的喜欢状态为: ${status}`)
  console.log(`🔍 当前数据状态:`, {
    trackListLength: audio.trackList.length,
    currentPageSongsLength: audio.currentPageSongs?.length || 0,
    propsDataLength: props.data?.length || 0
  })
  
  let updatedCount = 0
  
  // 更新播放列表中的状态
  audio.trackList.forEach(track => {
    // 统一ID比较：转换为数字进行比较
    const trackId = Number(track.id)
    const targetId = Number(songId)
    
    if (trackId === targetId) {
      track.likeStatus = status
      updatedCount++
      console.log(`✅ 更新播放列表中的歌曲 ${track.title || 'Unknown'} (ID: ${track.id}) 状态为: ${status}`)
    }
  })

  // 更新当前页面的歌曲列表状态
  if (audio.currentPageSongs) {
    audio.currentPageSongs.forEach(song => {
      const songIdNum = Number(song.songId)
      const targetId = Number(songId)
      
      if (songIdNum === targetId) {
        song.likeStatus = status
        updatedCount++
        console.log(`✅ 更新当前页面歌曲 ${song.songName} (ID: ${song.songId}) 状态为: ${status}`)
      }
    })
  }

  // 更新原始数据
  if (props.data) {
    props.data.forEach(song => {
      const songIdNum = Number(song.songId)
      const targetId = Number(songId)
      
      if (songIdNum === targetId) {
        song.likeStatus = status
        updatedCount++
        console.log(`✅ 更新原始数据中的歌曲 ${song.songName} (ID: ${song.songId}) 状态为: ${status}`)
      }
    })
  }
  
  console.log(`📊 总共更新了 ${updatedCount} 个数据源`)
  
  // 强制触发响应式更新 - 通过emit通知父组件
  if (props.data) {
    // 不直接修改props，而是通过emit通知父组件更新
    console.log(`📢 状态更新完成，建议刷新页面数据以同步状态`)
    emit('like-updated', { songId, status, updatedCount })
  }
}

// 处理喜欢/取消喜欢
const handleLike = async (e, row) => {
  e.stopPropagation() // 阻止事件冒泡
  
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  // 防止重复点击
  if (row.isProcessing) {
    return
  }
  
  // 设置处理中状态
  row.isProcessing = true

  try {
    console.log(`🎯 开始处理喜欢操作:`, {
      songId: row.songId,
      songName: row.songName,
      currentLikeStatus: row.likeStatus,
      targetStatus: row.likeStatus === 0 ? 1 : 0
    })
    
    // 检查数据源一致性
    const consistency = checkDataSourceConsistency(row.songId)
    console.log(`📊 数据源一致性检查:`, consistency)
    
    if (row.likeStatus === 0) {
      // 收藏歌曲
      console.log(`❤️ 收藏歌曲: ${row.songName} (ID: ${row.songId})`)
      const res = await collectSong(row.songId)
      console.log(`📡 收藏API响应:`, res)
      
      if (res.code === 0) {
        updateAllSongLikeStatus(row.songId, 1)
        ElMessage.success('已添加到我的喜欢')
      } else {
        ElMessage.error(res.message || '添加到我的喜欢失败')
      }
    } else {
      // 取消收藏
      console.log(`💔 取消收藏歌曲: ${row.songName} (ID: ${row.songId})`)
      const res = await cancelCollectSong(row.songId)
      console.log(`📡 取消收藏API响应:`, res)
      
      if (res.code === 0) {
        updateAllSongLikeStatus(row.songId, 0)
        ElMessage.success('已取消喜欢')
      } else {
        ElMessage.error(res.message || '取消喜欢失败')
      }
    }
  } catch (error) {
    console.error(`❌ 喜欢操作异常:`, error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    // 清除处理中状态
    row.isProcessing = false
  }
}

const downLoadMusic = (e, row) => {
  e.stopPropagation() // 阻止事件冒泡
  const link = document.createElement('a')
  link.href = row.audioUrl
  link.setAttribute('download', `${row.songName} - ${row.artistName}`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 判断是否是当前播放的歌曲
const isCurrentPlaying = (songId) => {
  try {
    // 使用注入的 audioPlayer 来判断
    if (audioPlayer?.currentTrack?.value) {
      const currentTrack = audioPlayer.currentTrack.value
      const isCurrent = Number(currentTrack.id) === Number(songId)
      
      // 添加调试信息（仅在开发环境）
      if (process.env.NODE_ENV === 'development' && isCurrent) {
        console.log('🎵 Table组件 - 当前播放歌曲匹配:', {
          songId,
          currentTrackId: currentTrack.id,
          isPlaying: isPlaying.value,
          currentTrack: currentTrack
        })
      }
      
      return isCurrent
    }
    
    // 回退到原来的逻辑
    const currentTrack = audio.trackList[audio.currentSongIndex]
    return currentTrack && Number(currentTrack.id) === Number(songId)
  } catch (error) {
    console.warn('🎵 Table组件 - 判断当前播放歌曲失败:', error)
    // 回退到原来的逻辑
    try {
      const currentTrack = audio.trackList[audio.currentSongIndex]
      return currentTrack && Number(currentTrack.id) === Number(songId)
    } catch (fallbackError) {
      console.error('🎵 Table组件 - 回退逻辑也失败:', fallbackError)
      return false
    }
  }
}

// 检查数据源一致性
const checkDataSourceConsistency = (songId) => {
  console.log(`🔍 检查歌曲 ${songId} 的数据源一致性:`)
  
  const trackListMatch = audio.trackList.filter(track => Number(track.id) === Number(songId))
  const currentPageMatch = audio.currentPageSongs?.filter(song => Number(song.songId) === Number(songId)) || []
  const propsDataMatch = props.data?.filter(song => Number(song.songId) === Number(songId)) || []
  
  console.log(`📊 数据源匹配结果:`, {
    trackList: trackListMatch.map(t => ({ id: t.id, name: t.songName, likeStatus: t.likeStatus })),
    currentPage: currentPageMatch.map(s => ({ id: s.songId, name: s.songName, likeStatus: s.likeStatus })),
    propsData: propsDataMatch.map(s => ({ id: s.songId, name: s.songName, likeStatus: s.likeStatus }))
  })
  
  return {
    trackListCount: trackListMatch.length,
    currentPageCount: currentPageMatch.length,
    propsDataCount: propsDataMatch.length
  }
}
</script>

<template>
  <el-table :data="data" style="
      --el-table-border: none;
      --el-table-border-color: none;
      --el-table-tr-bg-color: none;
      --el-table-header-bg-color: none;
      --el-table-row-hover-bg-color: transparent;
    " class="rounded-lg h-full transition duration-300">
    <el-table-column>
      <template #header>
        <div class="grid grid-cols-[auto_4fr_3fr_3fr_1fr_2fr_1fr] items-center gap-6 w-full text-left mt-2">
          <div class="ml-3">标题</div>
          <div class="w-12"></div>
          <div class="ml-1">歌手</div>
          <div>专辑</div>
          <div>喜欢</div>
          <div class="ml-7">时长</div>
          <div>下载</div>
        </div>
      </template>
      <template #default="scope">
        <div
          class="grid grid-cols-[auto_4fr_3fr_3fr_1fr_2fr_1fr] items-center gap-6 w-full group transition duration-300 rounded-2xl p-2"
          :class="[
            isCurrentPlaying(scope.row.songId) ? 'bg-[hsl(var(--hover-menu-bg))]' : 'hover:bg-[hsl(var(--hover-menu-bg))]',
            'cursor-pointer'
          ]"
          @click="handlePlay(scope.row)">
                        <!-- 标题和封面 -->
          <div class="w-10 h-10 relative" v-if="scope.row.coverUrl">
            <el-image :src="scope.row.coverUrl" fit="cover" lazy :alt="scope.row.songName" class="w-full h-full rounded-md" />
                          <!-- 播放/暂停按钮，使用 group-hover 控制透明度 -->
            <div
              class="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-300 z-10 group-hover:opacity-100 group-hover:bg-black/50 rounded-md">
              <!-- 根据播放状态显示不同图标 -->
              <icon-tabler:player-pause-filled v-if="audioPlayer && isCurrentPlaying(scope.row.songId) && isPlaying" class="text-lg" />
              <icon-tabler:player-play-filled v-else class="text-lg" />
            </div>
          </div>

          <!-- 歌曲名称 -->
          <div class="text-left">
            <div class="flex-1 line-clamp-1">{{ scope.row.songName }}</div>
          </div>

          <!-- 歌手 -->
          <div class="text-left">
            <div class="line-clamp-1 w-48">{{ scope.row.artistName }}</div>
          </div>

          <!-- 专辑 -->
          <div class="text-left">{{ scope.row.album }}</div>

          <!-- 喜欢 -->
          <div class="flex items-center ml-1">
            <el-button text circle @click="handleLike($event, scope.row)">
              <icon-mdi:cards-heart-outline v-if="scope.row.likeStatus === 0" class="text-lg" />
              <icon-mdi:cards-heart v-else class="text-lg text-red-500" />
            </el-button>
          </div>

          <!-- 时长 -->
          <div class="text-left ml-8">
            <span>{{ formatMillisecondsToTime(Number(scope.row.duration) * 1000) }}</span>
          </div>

          <!-- 下载 -->
          <div class="flex items-center ml-1">
            <el-button text circle @click.stop="downLoadMusic($event, scope.row)">
              <icon-material-symbols:download class="text-lg" />
            </el-button>
          </div>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
:deep(.el-table__row) {
  background: transparent important;
}

:deep(.el-table__row:hover) td {
  background: transparent important;
}

:deep(.el-table__cell) {
  padding: 0 important;
}
</style>