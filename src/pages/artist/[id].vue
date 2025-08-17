<script setup lang="js">
import { computed, watch } from 'vue'
import { getArtistDetail } from '@/api/system'
import Table from '@/components/Table.vue'
import { useArtistStore } from '@/stores/modules/artist'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { processImageUrl } from '@/utils/minio'


const route = useRoute()
const artistStore = useArtistStore()
// 歌手数据
const artistInfo = computed(() => artistStore.artistInfo)

const fetchArtistDetail = async () => {
    const id = route.params.id
    
    // 检查ID是否存在
    if (!id) {
        console.error('歌手ID不存在')
        ElMessage.error('歌手ID不存在')
        return
    }
    
    const numericId = parseInt(id.toString())

    try {
        artistStore.setArtistInfo(null) // 清空之前的数据
        const res = await getArtistDetail(numericId)

        if (res.code === 0 && res.data) {
            const artistData = res.data
            
            // 处理头像URL，移除 -blob 后缀并添加尺寸参数
            const processedAvatar = artistData.avatar ? processImageUrl(artistData.avatar, '400y400') : ''
            
            console.log('🎵 歌手详情页 - 头像URL处理:', {
                original: artistData.avatar,
                processed: processedAvatar
            })
            
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
    console.warn('🎵 歌手详情页 - 头像加载失败:', artistInfo.value?.avatar)
    // 可以设置默认头像
    event.target.src = '/src/assets/default_avatar.jpg'
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
                <div v-if="process.env.NODE_ENV === 'development' && artistInfo?.avatar" 
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
                    <p v-if="artistInfo?.introduction" class="mt-2 line-clamp-4">简介：{{ artistInfo.introduction }}
                    </p>
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
