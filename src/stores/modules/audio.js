import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'
import { trackListData } from '@/mock'

/**
 * 音频
 */
export const AudioStore = defineStore({
  id: 'AudioStore',
  state: () => ({
    // 歌曲缓存
    trackList: trackListData,
    // 当前播放歌曲索引
    currentSongIndex: 0,
    // 音量
    volume: 50,
    // 音质
    quality: 'exhigh',
    currentPageSongs: [], // 当前页面的歌曲列表
  }),
  actions: {
    //set AudioStore
    setAudioStore(key, value) {
      this[key] = value
    },
    // 新增歌曲或歌曲数组到 trackList
    addTracks(newTracks) {
      // 收集现有歌曲的ID
      const existingIds = new Set(
        this.trackList.map((track) => track.id)
      )
      // 将参数归一化为数组
      const tracksToAdd = Array.isArray(newTracks) ? newTracks : [newTracks]
      for (const track of tracksToAdd) {
        if (existingIds.has(track.id)) {
          this.currentSongIndex = this.trackList.findIndex(
            (existingTrack) => existingTrack.id === track.id
          )
          break
        } else {
          this.trackList.push(track)
          this.currentSongIndex = this.trackList.length - 1
        }
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