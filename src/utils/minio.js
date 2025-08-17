import { ElMessage } from 'element-plus'
import { updateUserAvatar, getUserInfo } from '@/api/system'

/**
 * MinIO 工具函数 - 修复版本
 * 使用正确的后端头像上传接口
 */

/**
 * 上传头像文件
 * @param {File} file - 要上传的头像文件
 * @returns {Promise<string>} 上传后的头像访问 URL
 */
export const uploadAvatar = async (file) => {
  try {
    if (!file) {
      throw new Error('文件不能为空')
    }

    console.log('🎵 开始上传头像:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // 创建 FormData
    const formData = new FormData()
    formData.append('avatar', file)

    // 调用后端头像上传接口
    const response = await updateUserAvatar(formData)
    
    console.log('🎵 后端头像上传响应:', response)
    
    // 检查响应状态
    if (response && response.code === 0) {
      // 上传成功，但后端返回的 data 为 null
      console.log('🎵 头像上传成功，但后端未返回URL，尝试获取用户信息')
      
      try {
        // 主动获取用户信息来获取新的头像URL
        const userInfoResponse = await getUserInfo()
        
        if (userInfoResponse.code === 0 && userInfoResponse.data) {
          const newAvatarUrl = userInfoResponse.data.avatarUrl || userInfoResponse.data.userAvatar || userInfoResponse.data.avatar || ''
          
          if (newAvatarUrl) {
            console.log('🎵 通过获取用户信息获取到新头像URL:', newAvatarUrl)
            return newAvatarUrl
          } else {
            console.warn('🎵 用户信息中也没有头像URL，响应数据:', userInfoResponse.data)
            throw new Error('头像上传成功但无法获取新的头像URL')
          }
        } else {
          console.error('🎵 获取用户信息失败:', userInfoResponse)
          throw new Error('头像上传成功但获取用户信息失败')
        }
      } catch (userInfoError) {
        console.error('🎵 获取用户信息异常:', userInfoError)
        throw new Error('头像上传成功但无法获取用户信息')
      }
    } else {
      // 上传失败
      const errorMessage = response?.message || response?.msg || '头像上传失败'
      console.error('🎵 头像上传失败:', errorMessage)
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error('🎵 头像上传异常:', error)
    
    // 如果是我们抛出的错误，直接抛出
    if (error.message && !error.message.includes('头像上传成功')) {
      ElMessage.error(`头像上传失败: ${error.message}`)
      throw error
    }
    
    // 如果是其他错误，包装后抛出
    const errorMessage = error.message || '头像上传失败'
    ElMessage.error(`头像上传失败: ${errorMessage}`)
    throw new Error(errorMessage)
  }
}

/**
 * 获取 MinIO 文件的 pre-signed URL（保留兼容性，但实际不使用）
 * @param {string} filename - 文件名
 * @param {string} bucket - 存储桶名称（可选）
 * @returns {Promise<string>} pre-signed URL
 */
export const getPresignedUrl = async (filename, bucket = null) => {
  try {
    if (!filename) {
      throw new Error('文件名不能为空')
    }

    // 构建请求参数
    const params = new URLSearchParams({ filename })
    if (bucket) {
      params.append('bucket', bucket)
    }

    // 调用后端 API 获取 pre-signed URL
    const response = await fetch(`/minio/presigned-url?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`获取 pre-signed URL 失败: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code !== 0) {
      throw new Error(data.message || '获取 pre-signed URL 失败')
    }

    return data.data.url
  } catch (error) {
    console.error('获取 pre-signed URL 失败:', error)
    ElMessage.error(`获取文件访问链接失败: ${error.message}`)
    throw error
  }
}

/**
 * 上传文件到 MinIO（保留兼容性，但实际不使用）
 * @param {File} file - 要上传的文件
 * @param {string} bucket - 存储桶名称（可选）
 * @returns {Promise<string>} 上传后的文件访问 URL
 */
export const uploadToMinio = async (file, bucket = null) => {
  try {
    if (!file) {
      throw new Error('文件不能为空')
    }

    // 1. 获取 pre-signed URL
    const presignedUrl = await getPresignedUrl(file.name, bucket)
    
    // 2. 直接上传到 MinIO
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })

    if (!uploadResponse.ok) {
      throw new Error(`文件上传失败: ${uploadResponse.status}`)
    }

    // 3. 返回文件访问 URL（去掉 PUT 参数）
    const fileUrl = presignedUrl.split('?')[0]
    console.log('文件上传成功:', fileUrl)
    
    return fileUrl
  } catch (error) {
    console.error('文件上传失败:', error)
    ElMessage.error(`文件上传失败: ${error.message}`)
    throw error
  }
}

/**
 * 处理图片 URL（兼容现有代码）
 * @param {string} url - 原始 URL
 * @param {string} defaultParam - 默认参数
 * @returns {string} 处理后的 URL
 */
export const processImageUrl = (url, defaultParam = '350y350') => {
  if (!url) return ''
  
  console.log('处理图片URL:', { url, defaultParam })
  
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 检查是否是 MinIO 的 songCovers、artists 或 playlists 路径，如果是则添加 -blob 后缀
    if ((url.includes('/songCovers/') || url.includes('/artists/') || url.includes('/playlists/')) && !url.includes('-blob')) {
      const baseUrl = url.split('?')[0] // 去掉查询参数
      const newUrl = baseUrl + '-blob'
      const result = defaultParam ? `${newUrl}?${defaultParam}` : newUrl
      console.log('MinIO URL 处理:', { original: url, processed: result })
      return result
    }
    console.log('完整URL，无需处理:', url)
    return url
  }
  
  // 如果是相对路径，添加默认参数
  const result = `${url}?${defaultParam}`
  console.log('相对路径处理:', { original: url, processed: result })
  return result
}

/**
 * 批量处理图片 URL
 * @param {Array} items - 包含 coverUrl 或 avatar 字段的项目数组
 * @param {string} defaultParam - 默认图片参数
 * @returns {Array} 处理后的项目数组
 */
export const processImageUrls = (items, defaultParam = '350y350') => {
  if (!Array.isArray(items)) return items
  
  console.log('批量处理图片URLs:', { itemsCount: items.length, defaultParam })
  
  return items.map((item, index) => {
    if (item.coverUrl) {
      item.coverUrl = processImageUrl(item.coverUrl, defaultParam)
    }
    if (item.avatar) {
      item.avatar = processImageUrl(item.avatar, defaultParam)
    }
    return item
  })
}

/**
 * 批量处理音频 URL
 * @param {Array} items - 包含 audioUrl 字段的项目数组
 * @returns {Array} 处理后的项目数组
 */
export const processAudioUrls = (items) => {
  if (!Array.isArray(items)) return items
  
  console.log('批量处理音频URLs:', { itemsCount: items.length })
  
  return items.map((item, index) => {
    if (item.audioUrl) {
      // 音频文件通常不需要添加 -blob 后缀，直接返回
      item.audioUrl = item.audioUrl
    }
    return item
  })
}