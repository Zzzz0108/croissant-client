import { defineStore } from 'pinia'
import { getFavoritePlaylists, collectPlaylist, cancelCollectPlaylist } from '@/api/system'
import { ElMessage } from 'element-plus'
import coverImg from '@/assets/cover.png'

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    favoritePlaylists: [],
    loading: false
  }),

  actions: {
    // 获取收藏的歌单列表
    async getFavoritePlaylists() {
      try {
        this.loading = true
        
        // 调用正确的API路径，使用正确的参数格式
        const res = await getFavoritePlaylists({ 
          pageNum: 1, 
          pageSize: 50,
          title: null,
          style: null
        })
        if (res.code === 0 && res.data) {
          const data = res.data
          if (data?.items) {
            this.favoritePlaylists = data.items.map(item => ({
              id: item.playlistId,
              name: item.title,
              coverImgUrl: item.coverUrl ?? coverImg
            }))
          }
        }
        
      } catch (error) {
        console.error('获取收藏歌单失败:', error)
        ElMessage.error('获取收藏歌单失败')
      } finally {
        this.loading = false
      }
    },

    // 收藏歌单
    async collectPlaylist(playlistId) {
      try {
        const res = await collectPlaylist(playlistId)
        if (res.code === 0) {
          ElMessage.success('收藏成功')
          // 重新获取收藏列表
          this.getFavoritePlaylists()
          return true
        }
        return false
      } catch (error) {
        ElMessage.error('收藏失败')
        return false
      }
    },

    // 取消收藏歌单
    async cancelCollectPlaylist(playlistId) {
      try {
        const res = await cancelCollectPlaylist(playlistId)
        if (res.code === 0) {
          ElMessage.success('取消收藏成功')
          // 从列表中移除
          this.favoritePlaylists = this.favoritePlaylists.filter(item => item.id !== playlistId)
          return true
        }
        return false
      } catch (error) {
        ElMessage.error('取消收藏失败')
        return false
      }
    },

    // 清空收藏列表
    clearFavoritePlaylists() {
      this.favoritePlaylists = []
    }
  }
}) 