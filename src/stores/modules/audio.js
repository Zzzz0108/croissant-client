import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'
import { trackListData } from '@/mock'

/**
 * 音频
 */
export const AudioStore = defineStore({
  id: 'AudioStore',
  //state定义初始状态，返回一个对象，是响应式数据，组件中可以访问修改，组件中修改后会自动更新到state中，state中的数据会自动持久化到本地存储，下次刷新页面后，会从本地存储中恢复
  state: () => ({
    // 歌曲缓存
    trackList: trackListData,
    // 当前播放歌曲索引
    currentSongIndex: 0,
    // 音量
    volume: 50,
    // 上次的音量（用于静音恢复）
    lastVolume: 50,
    // 播放模式
    playMode: 'order', // 'order' | 'shuffle' | 'loop' | 'single'
    // 音质
    quality: 'exhigh',
    currentPageSongs: [], // 当前页面的歌曲列表
  }),
  //actions定义方法，组件中可以调用这些方法，方法中可以访问修改state中的数据
  actions: {
    setAudioStore(key, value) {//通用方法，设置state中的数据，避免为每个状态属性单独编写 setter 方法
      this[key] = value
    },
    
    // 切换播放模式
    togglePlayMode() {
      const modes = ['order', 'shuffle', 'loop', 'single']
      const currentIndex = modes.indexOf(this.playMode)
      const nextIndex = (currentIndex + 1) % modes.length
      this.playMode = modes[nextIndex]
      return this.playMode
    },
    
    // 新增歌曲或歌曲数组到 trackList
    addTracks(newTracks) {
      const tracksToAdd = Array.isArray(newTracks) ? newTracks : [newTracks]
      // 记录当前播放歌曲
      const currentTrack = this.trackList[this.currentSongIndex]
      // 添加不重复的新歌曲
      const newSongs = tracksToAdd.filter(
        track => !this.trackList.some(existing => existing.id === track.id)
      )
      if (newSongs.length > 0) {
        this.trackList.push(...newSongs)
        // 保持播放原来的歌曲
        if (currentTrack) {
          this.currentSongIndex = this.trackList.findIndex(track => track.id === currentTrack.id)
        }
      } else {
        // 跳转到第一首已存在歌曲
        const firstExistingTrack = tracksToAdd[0]
        this.currentSongIndex = this.trackList.findIndex(track => track.id === firstExistingTrack.id)
      }
    },
    
    // 删除指定歌曲
    deleteTrack(id) {
      this.trackList = this.trackList.filter(
        (track) => track.id !== id
      )
    },
    
    // 设置当前页面的歌曲列表
    setCurrentPageSongs(songs) {
      this.currentPageSongs = songs
    }
  },
  persist: piniaPersistConfig('AudioStore'),
}) 