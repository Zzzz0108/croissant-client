<script setup lang="js">
import { computed, watch, inject } from 'vue'
import { getArtistDetail } from '@/api/system'
import Table from '@/components/Table.vue'
import { useArtistStore } from '@/stores/modules/artist'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { processImageUrl } from '@/utils/minio'
import { isDev } from '@/config/env'
import { AudioStore } from '@/stores/modules/audio'


const route = useRoute()
const artistStore = useArtistStore()
const audio = AudioStore()

// 直接注入 audioPlayer
const audioPlayer = inject('audioPlayer')
const { loadTrack, play } = audioPlayer || {}

// 歌手数据
const artistInfo = computed(() => artistStore.artistInfo)

const fetchArtistDetail = async () => {
    const id = route.params.id
    
    // 如果没有ID，直接返回，不显示错误
    if (!id) {
        return
    }
    
    const numericId = parseInt(id.toString())

    try {
        artistStore.setArtistInfo(null) // 清空之前的数据
        const res = await getArtistDetail(numericId)

        if (res.code === 0 && res.data) {
            const artistData = res.data
            
            // 处理头像URL，判断是否包含blob，如果有则使用processImageUrl处理
            let processedAvatar = ''
            if (artistData.avatar) {
                if (artistData.avatar.includes('blob')) {
                    processedAvatar = processImageUrl(artistData.avatar, '400y400')
                } else {
                    processedAvatar = artistData.avatar
                }
            }
            
            artistStore.setArtistInfo({
                artistId: artistData.artistId,
                artistName: artistData.artistName || '未知歌手',
                avatar: processedAvatar,
                birth: artistData.birth || '',
                area: artistData.area || '未知',
                introduction: artistData.introduction || '暂无简介',
                songs: artistData.songs || []
            })
        } else {
            ElMessage.error(res.message || '获取歌手信息失败')
        }
    } catch (error) {
        console.error('获取歌手详情失败:', error)
        ElMessage.error('获取歌手信息失败，请稍后重试')
    }
}

watch(
    () => route.params.id,
    () => {
        fetchArtistDetail()
    },
    { immediate: true }
)

// 格式化生日
const formatBirth = (birth) => {
    if (!birth) return ''
    return new Date(birth).toLocaleDateString()
}

// 头像加载成功处理
const handleAvatarLoad = () => {
    console.log('🎵 歌手详情页 - 头像加载成功:', artistInfo.value?.avatar)
}

// 头像加载失败处理
const handleAvatarError = (event) => {
    // 静默处理头像加载失败，不输出控制台警告
    event.target.src = '/src/assets/default_avatar.jpg'
}

// 播放全部歌曲
const handlePlayAll = async () => {
    try {
        console.log('🎵 歌手详情页 - 播放全部开始:', {
            songsCount: artistInfo.value?.songs?.length || 0,
            songs: artistInfo.value?.songs
        })

        if (!artistInfo.value?.songs || artistInfo.value.songs.length === 0) {
            console.warn('🎵 歌手详情页 - 没有歌曲可播放')
            ElMessage.warning('暂无歌曲可播放')
            return
        }

        // 转换歌曲数据格式
        const result = artistInfo.value.songs.map(song => {
            // 处理歌曲封面URL，判断是否包含blob
            let coverUrl = '/src/assets/default_album.jpg'
            if (song.coverUrl) {
                if (song.coverUrl.includes('blob')) {
                    coverUrl = processImageUrl(song.coverUrl, '350y350')
                } else {
                    coverUrl = song.coverUrl
                }
            }
            
            return {
                id: song.songId.toString(),
                title: song.songName,
                artist: song.artistName,
                album: song.album,
                cover: coverUrl,
                url: song.audioUrl,
                duration: Number(song.duration) || 0,
                likeStatus: song.likeStatus || 0
            }
        })

        console.log('🎵 歌手详情页 - 转换后的歌曲数据:', result)

        // 设置播放列表和当前歌曲索引
        audio.setAudioStore('trackList', result)
        audio.setAudioStore('currentSongIndex', 0)

        console.log('🎵 歌手详情页 - 播放列表设置完成:', {
            trackList: result,
            currentSongIndex: 0
        })

        // 加载并播放第一首歌
        if (loadTrack && play) {
            await loadTrack()
            await play()
            console.log('🎵 歌手详情页 - 播放全部成功')
        } else {
            console.error('🎵 歌手详情页 - loadTrack 或 play 函数未注入')
        }
    } catch (error) {
        console.error('🎵 歌手详情页 - 播放全部失败:', error)
    }
}
</script>

<template>
    <div class="container mx-auto py-10 px-5 h-full flex-1 flex flex-col">
        <!-- 歌手详情 -->
        <div class="flex flex-col lg:flex-row items-center gap-8">
            <div class="w-48 h-48 rounded-full overflow-hidden bg-gray-200">
                <!-- 调试信息 -->
                <div v-if="!artistInfo?.avatar" class="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                    暂无头像
                </div>
                <img 
                    v-else
                    :src="artistInfo.avatar" 
                    :alt="artistInfo.artistName" 
                    class="w-full h-full object-cover"
                    @error="handleAvatarError"
                    @load="handleAvatarLoad"
                />
                
                <!-- 调试信息（开发环境） -->
                <div v-if="isDev && artistInfo?.avatar" 
                     class="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 rounded-br">
                    {{ artistInfo.avatar.substring(0, 30) }}...
                </div>
            </div>
            <div class="text-center lg:text-left flex-1">
                <h1 class="text-3xl font-semibold text-foreground">
                    {{ artistInfo?.artistName }}
                </h1>
                <div class="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p v-if="artistInfo?.birth">生日：{{ formatBirth(artistInfo.birth) }}</p>
                    <p v-if="artistInfo?.area">地区：{{ artistInfo.area }}</p>
                    <p v-if="artistInfo?.songs?.length">歌曲：{{ artistInfo.songs.length }} 首</p>
                    <p v-if="artistInfo?.introduction" class="mt-2 line-clamp-4">简介：{{ artistInfo.introduction }}
                    </p>
                </div>
                
                <!-- 播放全部按钮 -->
                <div class="mt-6">
                    <button @click="handlePlayAll"
                        class="text-white inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-8 shadow-md hover:shadow-lg transition-shadow">
                        <icon-solar:play-line-duotone />
                        播放全部
                    </button>
                </div>
            </div>
        </div>

        <!-- 歌曲列表 -->
        <div class="mt-12 flex flex-col flex-1">
            <h2 class="text-2xl font-semibold text-foreground mb-6">所有歌曲</h2>
            <div class="w-full h-full flex">
                <Table :data="artistInfo?.songs" />
            </div>
        </div>
    </div>
</template>
