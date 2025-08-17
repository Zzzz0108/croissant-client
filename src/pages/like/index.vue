<script setup lang="js">
import { ref, watch, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { getFavoriteSongs } from '@/api/system'
import coverImg from '@/assets/cover.png'
import { AudioStore } from '@/stores/modules/audio'

const route = useRoute()
const audio = AudioStore()

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const { loadTrack, play } = audioPlayer || {}

const songs = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const playlist = ref({
    name: '我喜欢的音乐',
    coverImgUrl: coverImg,
    trackCount: 0,
    tags: []
})


const getSongs = async () => {
    const res = await getFavoriteSongs({
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        songName: searchKeyword.value,
        artistName: '',
        album: ''
    })
    if (res.code === 0 && res.data) {
        const pageData = res.data
        
        // 去重逻辑：基于songId去重
        const uniqueSongs = []
        const seenIds = new Set()
        
        pageData.items.forEach(song => {
            const songId = Number(song.songId)
            if (!seenIds.has(songId)) {
                seenIds.add(songId)
                uniqueSongs.push(song)
            } else {
                console.warn(`⚠️ 发现重复歌曲: ${song.songName} (ID: ${song.songId})`)
            }
        })
        
        console.log(`📊 去重结果: 原始数据 ${pageData.items.length} 首，去重后 ${uniqueSongs.length} 首`)
        
        // 检查数据质量
        checkDataQuality(uniqueSongs)
        
        songs.value = uniqueSongs
        playlist.value.trackCount = uniqueSongs.length
        // 使用第一首歌的封面作为封面图
        if (uniqueSongs.length > 0) {
            playlist.value.coverImgUrl = uniqueSongs[0].coverUrl || coverImg
        }
    }
}

const handleSearch = () => {
    currentPage.value = 1 // 搜索时重置页码
    getSongs()
}

// 检查数据质量
const checkDataQuality = (songs) => {
    console.log(`🔍 数据质量检查: ${songs.length} 首歌曲`)
    
    const issues = []
    const idCounts = {}
    
    songs.forEach((song, index) => {
        // 检查ID
        if (!song.songId) {
            issues.push(`第${index + 1}首歌曲缺少songId`)
        } else {
            const songId = Number(song.songId)
            idCounts[songId] = (idCounts[songId] || 0) + 1
        }
        
        // 检查必要字段
        if (!song.songName) {
            issues.push(`第${index + 1}首歌曲缺少songName`)
        }
        if (!song.artistName) {
            issues.push(`第${index + 1}首歌曲缺少artistName`)
        }
    })
    
    // 检查重复ID
    Object.entries(idCounts).forEach(([id, count]) => {
        if (count > 1) {
            issues.push(`歌曲ID ${id} 出现了 ${count} 次`)
        }
    })
    
    if (issues.length > 0) {
        console.warn(`⚠️ 数据质量问题:`, issues)
    } else {
        console.log(`✅ 数据质量良好`)
    }
    
    return issues
}

const handlePlayAll = async () => {
    try {
        console.log('🎵 收藏歌单页面 - 播放全部开始:', {
            songsCount: songs.value.length,
            songs: songs.value
        })

        if (!songs.value || songs.value.length === 0) {
            console.warn('🎵 收藏歌单页面 - 没有歌曲可播放')
            return
        }

        // 转换歌曲数据格式
        const result = songs.value.map(song => ({
            id: song.songId.toString(),
            title: song.songName,
            artist: song.artistName,
            album: song.album,
            cover: song.coverUrl || coverImg,
            url: song.audioUrl,
            duration: parseFloat(song.duration) * 1000,
            likeStatus: song.likeStatus
        }))

        console.log('🎵 收藏歌单页面 - 转换后的歌曲数据:', result)

        // 设置播放列表和当前歌曲索引
        audio.setAudioStore('trackList', result)
        audio.setAudioStore('currentSongIndex', 0)

        console.log('🎵 收藏歌单页面 - 播放列表设置完成:', {
            trackList: result,
            currentSongIndex: 0
        })

        // 加载并播放第一首歌
        if (loadTrack && play) {
            await loadTrack()
            await play()
            console.log('🎵 收藏歌单页面 - 播放全部成功')
        } else {
            console.error('🎵 收藏歌单页面 - loadTrack 或 play 函数未注入')
        }
    } catch (error) {
        console.error('🎵 收藏歌单页面 - 播放全部失败:', error)
    }
}

// 监听当前页面歌曲列表的变化
watch(() => audio.currentPageSongs, (newSongs) => {
    if (newSongs && newSongs.length > 0) {
        // 检查是否有歌曲的收藏状态变为0（取消收藏）
        const hasUnlikedSong = newSongs.some((song) => song.likeStatus === 0)
        if (hasUnlikedSong) {
            getSongs() // 重新获取收藏列表
        }
    }
}, { deep: true })

// 监听路由变化，每次进入页面时重新获取数据
watch(() => route.path, (newPath) => {
    if (newPath === '/like') {
        getSongs()
    }
})

onMounted(() => {
    getSongs()
})
</script>

<template>
  <div class="flex flex-col h-full bg-background flex-1 md:overflow-hidden p-4">
    <!-- 歌单信息区域 -->
    <div class="flex flex-col md:flex-row p-6 gap-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 backdrop-blur-sm mb-6">
      <div class="flex-shrink-0 w-60 h-60">
        <img :alt="playlist.name" class="w-full h-full object-cover rounded-2xl shadow-xl shadow-gray-300/50 dark:shadow-gray-700/50"
          :src="playlist.coverImgUrl + '?param=500y500'" />
      </div>
      <div class="flex flex-col justify-between flex-1">
        <div>
          <h1 class="text-3xl font-bold mb-2">{{ playlist.name }}</h1>
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-4 ml-1">
            <span>{{ playlist.trackCount }} 首歌曲</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted-foreground" v-if="playlist.tags">
            <el-tag v-for="tag in playlist.tags" class="text-sm" effect="dark" :key="tag">{{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="flex items-center justify-between mt-4">
          <button @click="handlePlayAll"
            class="text-white inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-8 shadow-md hover:shadow-lg transition-shadow">
            <icon-solar:play-line-duotone />
            播放全部
          </button>

          <div class="relative">
            <icon-akar-icons:search
              class="lucide lucide-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input v-model="searchKeyword" @keyup.enter="handleSearch"
              class="flex h-10 rounded-xl border border-input transform duration-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 pl-10 w-56 shadow-sm"
              placeholder="搜索" />
          </div>
        </div>
      </div>
    </div>
    <Table :data="songs" class="flex-1 md:overflow-x-hidden" />
    <nav class="mx-auto flex w-full justify-center">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="playlist.trackCount"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getSongs"
        @current-change="getSongs"
      />
    </nav>
  </div>
</template>