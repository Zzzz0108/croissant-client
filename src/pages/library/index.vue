<script setup lang="js">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
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
        console.log('正在获取曲库数据...', {
            pageNum: currentPage.value,
            pageSize: pageSize.value,
            songName: route.query.query || '',
            artistName: '',
            album: ''
        })
        
        const res = await getAllSongs({
            pageNum: currentPage.value,
            pageSize: pageSize.value,
            songName: route.query.query || '',
            artistName: '',
            album: '',
        })
        
        console.log('曲库数据响应:', res)
        
        if (res.code === 0 && res.data) {
            // 处理图片 URL，添加 -blob 后缀
            const processedData = {
                ...res.data,
                items: processImageUrls(res.data.items || [])
            }
            libraryStore.setTableData(processedData)
            state.total = res.data.total || 0
            console.log('曲库数据设置成功:', processedData)
        } else {
            console.error('获取曲库数据失败:', res.message)
        }
    } catch (error) {
        console.error('获取曲库数据异常:', error)
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
    <div class="flex-1 h-full flex flex-col overflow-hidden">
        <Table :data="tableData?.items" class="flex-1 overflow-x-hidden" />
        <nav class="mx-auto flex w-full justify-center mt-3">
            <el-pagination v-model:page-size="pageSize" v-model:currentPage="currentPage" v-bind="state"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" class="mb-3" />
        </nav>
    </div>
</template>