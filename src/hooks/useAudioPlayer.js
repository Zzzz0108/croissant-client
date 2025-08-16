import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
import { defaultSong } from '@/mock'
import { ElNotification } from 'element-plus'
import { urlV1 } from '@/api'
import { AudioStore } from '@/stores/modules/audio'

export const AudioPlayer = () => {
  const audioStore = AudioStore()
  const audioElement = ref(null)
  const isPlaying = ref(false)
  const volume = ref()
  const playMode = ref('order') // 默认为顺序播放

  // 当前播放的歌曲
  const currentTrack = computed(
    () => {
      const track = audioStore.trackList[audioStore.currentSongIndex] || defaultSong
      console.log('currentTrack 计算属性:', {
        trackList: audioStore.trackList,
        currentSongIndex: audioStore.currentSongIndex,
        track: track
      })
      return track
    }
  )
  const currentTime = ref(0)
  const duration = ref(0)

  // 播放音乐
  const play = async () => {
    if (!audioElement.value) {
      console.warn('音频元素不存在，无法播放')
      return
    }
    
    if (!currentTrack.value || !currentTrack.value.url) {
      console.warn('当前歌曲信息不完整，无法播放')
      return
    }

    try {
      await audioElement.value.play()
      isPlaying.value = true
    } catch (error) {
      console.error('播放失败:', error)
      isPlaying.value = false
      ElNotification({
        title: '播放失败',
        message: '无法播放音频，请检查音频文件',
        type: 'error'
      })
    }
  }
  // 跳转到指定时间
  const seek = (time) => {
    if (audioElement.value) {
      audioElement.value.currentTime = time
      currentTime.value = time
    }
  }
  // 暂停音乐
  const pause = () => {
    if (audioElement.value) {
      audioElement.value.pause()
      isPlaying.value = false
    }
  }

  // 播放下一首
  const nextTrack = async () => {
    switch (playMode.value) {
      case 'loop':
        if (audioStore.currentSongIndex < audioStore.trackList.length - 1) {
          audioStore.currentSongIndex++
        } else {
          audioStore.currentSongIndex = 0 // 从头开始
        }
        break
      case 'shuffle':
        audioStore.currentSongIndex = Math.floor(
          Math.random() * audioStore.trackList.length
        )
        break
      case 'single':
        audioElement.value.currentTime = 0
        break
      case 'order':
      default:
        if (audioStore.currentSongIndex < audioStore.trackList.length - 1) {
          audioStore.currentSongIndex++
        } else {
          audioStore.currentSongIndex = 0 // 从头开始
        }
        break
    }
    await loadTrack()
    play()
  }

  // 播放上一首
  const prevTrack = async () => {
    switch (playMode.value) {
      case 'loop':
        if (audioStore.currentSongIndex > 0) {
          audioStore.currentSongIndex--
        } else {
          audioStore.currentSongIndex = audioStore.trackList.length - 1 // 从尾开始
        }
        break
      case 'shuffle':
        audioStore.currentSongIndex = Math.floor(
          Math.random() * audioStore.trackList.length
        )
        break
      case 'single':
        audioElement.value.currentTime = 0
        break
      case 'order':
      default:
        if (audioStore.currentSongIndex > 0) {
          audioStore.currentSongIndex--
        } else {
          audioStore.currentSongIndex = audioStore.trackList.length - 1 // 从尾开始
        }
        break
    }
    await loadTrack()
    play()
  }

  // 加载当前歌曲
  const loadTrack = async () => {
    console.log('loadTrack 开始执行:', {
      currentTrack: currentTrack.value,
      audioElement: audioElement.value
    })
    
    // 检查 currentTrack 是否存在
    if (!currentTrack.value || !currentTrack.value.id) {
      console.warn('当前歌曲信息不完整，跳过加载', currentTrack.value)
      return
    }

    // 检查歌曲 URL
    await checkUrl()

    if (audioElement.value && currentTrack.value.url) {
      // 只有在URL不同时才重新设置
      if (audioElement.value.src !== currentTrack.value.url) {
        console.log('设置音频源:', currentTrack.value.url)
        audioElement.value.src = currentTrack.value.url
        audioElement.value.load()
      }
    } else {
      console.warn('音频元素或歌曲URL不存在，无法加载', {
        audioElement: audioElement.value,
        url: currentTrack.value?.url
      })
    }
  }

  // 检查歌曲 URL
  const checkUrl = async () => {
    // 检查 currentTrack 是否存在且有 id
    if (!currentTrack.value || !currentTrack.value.id) {
      console.warn('当前歌曲信息不完整，跳过URL检查')
      return Promise.resolve()
    }

    // 查看歌曲 URL 是否存在
    if (!currentTrack.value.url) {
      try {
        // 如果 currentTrack 的 url 不存在，则获取 URL
        const response = await urlV1(currentTrack.value.id)
        
        if (response.code === 0 && response.data && response.data[0]?.url) {
          const url = response.data[0].url // 获取第一个 URL
          
          // 更新 trackList 中的对应歌曲的 url
          const trackIndex = audioStore.trackList.findIndex(
            (track) => track.id === currentTrack.value.id
          )
          if (trackIndex !== -1) {
            audioStore.trackList[trackIndex].url = url // 更新 URL
            console.log('歌曲URL已更新:', url)
          }
        } else {
          console.warn('获取歌曲URL失败:', response.message)
        }
      } catch (error) {
        console.error('获取歌曲URL异常:', error)
      }
    }
    return Promise.resolve()
  }

  // 更新当前播放时间
  const updateTime = () => {
    if (audioElement.value) {
      currentTime.value = audioElement.value.currentTime
    }
  }

  // 更新总时长
  const onLoadedMetadata = () => {
    if (audioElement.value) {
      duration.value = audioElement.value.duration
    }
  }

  // 切换播放/暂停状态
  const togglePlayPause = () => {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  // 设置音量
  const setVolume = (newVolume) => {
    if (audioElement.value) {
      volume.value = newVolume
      audioStore.setAudioStore('volume', newVolume)
      audioElement.value.volume = newVolume / 100
    }
  }

  // 设置播放模式
  const setPlayMode = (mode) => {
    playMode.value = mode
    const modeText = {
      order: '顺序播放',
      shuffle: '随机播放',
      loop: '列表循环',
      single: '单曲循环',
    }
    ElNotification({
      title: '播放模式',
      message: `已切换为${modeText[mode]}`,
      type: 'success',
    })
  }

  // 组件挂载时初始化音频元素
  onMounted(() => {
    audioElement.value = new Audio(currentTrack.value.url)
    volume.value = audioStore.volume || 50
    audioElement.value.volume = volume.value / 100
    // 添加事件监听器
    audioElement.value.addEventListener('timeupdate', updateTime)
    audioElement.value.addEventListener('ended', nextTrack)
    audioElement.value.addEventListener('loadedmetadata', onLoadedMetadata)
    audioElement.value.addEventListener('error', (e) => {
      console.error('音频播放错误:', e)
      ElNotification({
        title: '播放错误',
        message: '音频加载失败，请稍后重试',
        type: 'error'
      })
    })
  })

  // 组件卸载时移除事件监听器
  onUnmounted(() => {
    if (audioElement.value) {
      audioElement.value.removeEventListener('timeupdate', updateTime)
      audioElement.value.removeEventListener('ended', nextTrack)
      audioElement.value.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  })

  const audioPlayer = {
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    audioElement,
    play,
    pause,
    nextTrack,
    prevTrack,
    seek,
    togglePlayPause,
    setVolume,
    setPlayMode,
    loadTrack,
  }

  return audioPlayer
}

export const useAudioPlayer = () => {
  const audioPlayer = inject('audioPlayer')
  if (!audioPlayer) {
    throw new Error('useAudioPlayer must be used within a provider')
  }
  return audioPlayer
} 