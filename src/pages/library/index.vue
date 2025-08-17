<script setup lang="js">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllSongs } from '@/api/system'
import { useLibraryStore } from '@/stores/modules/library'
import { processImageUrls } from '@/utils/minio'

const route = useRoute()
const libraryStore = useLibraryStore()

const props = defineProps({
    selected: {
        type: String,
        default: '1',
    },
})
const tableData = computed(() => libraryStore.tableData)

const currentPage = ref(1) // 当前页
const pageSize = ref(20) // 每页显示的数量



const state = reactive({
    size: 'default',
    disabled: false,
    background: false,
    layout: 'total, sizes, prev, pager, next, jumper',
    total: 0,
    pageSizes: [20, 30, 50],
})

// 监听分页变化
const handleSizeChange = () => {
    getSongs()
}
// 监听当前页变化
const handleCurrentChange = () => {
    getSongs()
}





const getSongs = async () => {
    try {
        libraryStore.setTableData(null)
        const searchQuery = route.query.query || ''
        
        console.log('🎵 曲库页面 - 获取歌曲数据:', {
            pageNum: currentPage.value,
            pageSize: pageSize.value,
            searchQuery: searchQuery,
            hasSearchQuery: !!searchQuery
        })
        
        let res
        if (searchQuery) {
            // 如果有搜索关键词，使用 getAllSongs API 进行搜索
            console.log('🎵 曲库页面 - 使用 getAllSongs 进行搜索:', searchQuery)
            

            
            // 智能搜索：尝试判断搜索关键词的类型
            const searchParams = {
                pageNum: currentPage.value,
                pageSize: pageSize.value,
                songName: '',      // 默认为空
                artistName: '',    // 默认为空
                album: ''          // 默认为空
            }
            
            // 简单判断：如果包含特定关键词，优先搜索对应字段
            if (searchQuery.toLowerCase().includes('artist') || searchQuery.toLowerCase().includes('歌手')) {
                searchParams.artistName = searchQuery
                console.log('🎵 曲库页面 - 识别为艺术家搜索')
            } else if (searchQuery.toLowerCase().includes('album') || searchQuery.toLowerCase().includes('专辑')) {
                searchParams.album = searchQuery
                console.log('🎵 曲库页面 - 识别为专辑搜索')
            } else {
                // 默认搜索歌名
                searchParams.songName = searchQuery
                console.log('🎵 曲库页面 - 识别为歌名搜索')
            }
            
            console.log('🎵 曲库页面 - 搜索参数:', searchParams)
            res = await getAllSongs(searchParams)
        } else {
            // 如果没有搜索关键词，使用获取所有歌曲API
            console.log('🎵 曲库页面 - 使用获取所有歌曲API')
            res = await getAllSongs({
                pageNum: currentPage.value,
                pageSize: pageSize.value,
                songName: '',
                artistName: '',
                album: '',
            })
        }
        
        console.log('🎵 曲库页面 - API响应:', res)
        
        if (res.code === 0 && res.data) {
            // 处理图片 URL，添加 -blob 后缀
            const processedData = {
                ...res.data,
                items: processImageUrls(res.data.items || [])
            }
            libraryStore.setTableData(processedData)
            state.total = res.data.total || 0
            console.log('🎵 曲库页面 - 数据设置成功:', processedData)
        } else {
            console.error('🎵 曲库页面 - 获取数据失败:', res.message)
        }
    } catch (error) {
        console.error('🎵 曲库页面 - 获取数据异常:', error)
    }
}



watch(
    () => [route.query.query, props.selected],
    (val) => {
        // 修复：当选择"曲库"时也要获取数据
        getSongs()
    },
    {
        immediate: true,
    }
)
</script>

<template>
    <div class="flex-1 h-full flex flex-col overflow-hidden p-4">

        
        <!-- 搜索结果提示 -->
        <div v-if="route.query.query" class="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-md shadow-blue-200/30 dark:shadow-blue-900/20 mb-4">
            <div class="flex items-center justify-between">
                <span class="text-sm text-blue-700 dark:text-blue-300">
                    搜索结果: "{{ route.query.query }}" (共 {{ state.total }} 首歌曲)
                </span>
                <el-button 
                    type="text" 
                    size="small" 
                    @click="clearSearch"
                    class="text-blue-600 hover:text-blue-700"
                >
                    清除搜索
                </el-button>
            </div>
        </div>
        
        <!-- 表格内容 -->
        <div class="flex-1 overflow-x-hidden bg-white/50 dark:bg-gray-800/50 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 backdrop-blur-sm p-4">
            <Table :data="tableData?.items" class="flex-1 overflow-x-hidden" />
        </div>
        
        <!-- 分页 -->
        <nav class="mx-auto flex w-full justify-center">
            <el-pagination v-model:page-size="pageSize" v-model:currentPage="currentPage" v-bind="state"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </nav>
    </div>
</template>

