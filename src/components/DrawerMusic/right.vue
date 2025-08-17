<script setup lang="js">
import { ref, inject, computed } from 'vue'
import { formatNumber } from '@/utils'
import coverImg from '@/assets/cover.png'
import { likeComment, cancelLikeComment, addSongComment, getSongDetail, deleteComment } from '@/api/system'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserStore } from '@/stores/modules/user'

const songDetail = inject('songDetail')
const userStore = UserStore()

// 获取当前用户名
const currentUsername = computed(() => userStore.userInfo?.username || '')

// 评论相关
const commentContent = ref('')
const maxLength = 180

// 对评论进行排序，最新的显示在前面
const comments = computed(() => {
  if (!songDetail.value?.comments) return []
  return [...songDetail.value.comments].sort((a, b) => b.commentId - a.commentId)
})

// 发布评论
const handleComment = async () => {
  console.log('🎵 DrawerMusic 发布评论开始:', {
    isLoggedIn: userStore.isLoggedIn,
    userInfo: userStore.userInfo,
    token: userStore.userInfo?.token,
    commentContent: commentContent.value,
    songDetail: songDetail.value,
    songId: songDetail.value?.songId
  })
  
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  try {
    const songId = songDetail.value?.songId
    if (!songId) {
      ElMessage.error('歌曲ID不存在')
      return
    }
    
    const content = commentContent.value.trim()
    console.log('🎵 DrawerMusic 调用评论API:', { songId, content })
    
    // 尝试调用评论API
    try {
      const res = await addSongComment(songId, content)
      console.log('🎵 DrawerMusic 评论API调用成功:', res)
      
      if (res.code === 0) {
        ElMessage.success('评论发布成功')
        commentContent.value = ''
        // 重新获取歌曲详情以更新评论列表
        const detailRes = await getSongDetail(songId)
        if (detailRes.code === 0 && detailRes.data) {
          songDetail.value = detailRes.data
        }
      } else {
        ElMessage.error('评论发布失败')
      }
    } catch (error) {
      console.error('🎵 DrawerMusic 评论API调用失败:', error)
      ElMessage.error('评论发布失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('评论发布失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理点赞
const handleLike = async (comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    console.log('🎵 DrawerMusic 处理点赞:', { comment })
    
    // 检查是否已经点赞
    const isLiked = comment.isLiked || false
    
    let res
    if (isLiked) {
      // 如果已经点赞，则取消点赞
      console.log('🎵 DrawerMusic 取消点赞评论:', comment.commentId)
      res = await cancelLikeComment(comment.commentId)
    } else {
      // 如果未点赞，则点赞
      console.log('🎵 DrawerMusic 点赞评论:', comment.commentId)
      res = await likeComment(comment.commentId)
    }
    
    if (res.code === 0) {
      // 更新评论的点赞状态和数量
      if (songDetail.value && songDetail.value.comments) {
        const updatedComments = songDetail.value.comments.map(item => {
          if (item.commentId === comment.commentId) {
            return {
              ...item,
              isLiked: !isLiked,
              likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1
            }
          }
          return item
        })
        
        songDetail.value = {
          ...songDetail.value,
          comments: updatedComments
        }
      }

      ElMessage.success(isLiked ? '取消点赞成功' : '点赞成功')
    }
  } catch (error) {
    console.error('🎵 DrawerMusic 点赞操作失败:', error)
    ElMessage.error('点赞操作失败')
  }
}

// 删除评论
const handleDelete = async (comment) => {
  try {
    console.log('🎵 DrawerMusic 删除评论:', { comment })
    
    // 确认删除
    const confirmed = await ElMessageBox.confirm(
      '确定要删除这条评论吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    if (confirmed) {
      const res = await deleteComment(comment.commentId)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        // 重新获取歌曲详情以更新评论列表
        const songId = songDetail.value?.songId
        if (songId) {
          const detailRes = await getSongDetail(songId)
          if (detailRes.code === 0 && detailRes.data) {
            songDetail.value = detailRes.data
          }
        }
      } else {
        ElMessage.error('删除失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('🎵 DrawerMusic 删除评论失败:', error)
      ElMessage.error('删除失败')
    }
  }
}
</script>

<template>
  <div class="h-full p-6 overflow-y-auto mr-16">
    <div v-if="songDetail" class="space-y-6">
      <!-- 歌曲信息 -->
      <div class="space-y-2">
        <h3 class="text-xl font-semibold text-primary-foreground">歌曲信息</h3>
        <div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span class="text-primary-foreground">专辑：</span>
            {{ songDetail.album }}
          </div>
          <div>
            <span class="text-primary-foreground">发行时间：</span>
            {{ formatDate(songDetail.releaseTime) }}
          </div>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="space-y-4">
        <h3 class="text-xl font-semibold text-primary-foreground mt-12">评论（{{ formatNumber(songDetail.comments?.length || 0) }}）</h3>
        
        <!-- 评论输入框 -->
        <div class="mb-4">
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="4"
                :maxlength="maxLength"
                placeholder="说点什么吧"
                resize="none"
                show-word-limit
              />
              <div class="flex justify-end items-center mt-4">
                <button @click="handleComment" :disabled="!commentContent.trim()"
                  class="px-6 py-1.5 bg-primary text-white rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors">
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论列表 -->
        <div v-if="comments.length > 0" class="space-y-4">
          <template v-for="comment in comments" :key="comment.commentId">
            <div class="flex gap-3 group">
              <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <img :src="comment.userAvatar || coverImg" alt="avatar" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-blue-500">{{ comment.username }}</span>
                </div>
                <p class="text-sm mt-1 mb-2">{{ comment.content }}</p>
                <div class="flex items-center justify-between text-sm text-gray-400">
                  <span class="text-xs">{{ comment.createTime }}</span>
                  <div class="flex items-center gap-4">
                    <!-- 如果是用户自己的评论，显示删除按钮 -->
                    <button v-if="comment.username === currentUsername"
                      class="flex items-center gap-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="handleDelete(comment)"
                    >
                      <icon-material-symbols:delete-outline />
                      <span>删除</span>
                    </button>
                    <button 
                      class="flex items-center gap-1 hover:text-gray-600"
                      @click="handleLike(comment)"
                    >
                      <span>{{ formatNumber(comment.likeCount) }}</span>
                      <icon-material-symbols:thumb-up />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="border-b border-gray-300/70"></div>
          </template>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <p>暂无评论，快来抢沙发吧~</p>
        </div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center h-full">
      <el-empty description="暂无歌曲信息" />
    </div>
  </div>
</template>

<style scoped>
.el-button {
  --el-button-hover-text-color: var(--el-color-primary);
  --el-button-hover-bg-color: transparent;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-textarea__inner) {
  border-radius: 12px important;
}
</style>
