import { ElMessage } from 'element-plus'

/**
 * MinIO 工具函数 - 简化版本
 * 只包含核心的文件上传和 URL 处理功能
 */

/**
 * 获取 MinIO 文件的 pre-signed URL
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
 * 上传文件到 MinIO
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
    console.log(`处理第 ${index + 1} 项:`, item)
    
    // 处理 coverUrl 字段（歌曲封面）
    if (item.coverUrl) {
      console.log(`处理 coverUrl: ${item.coverUrl}`)
      item.coverUrl = processImageUrl(item.coverUrl, defaultParam)
    }
    // 处理 avatar 字段（歌手头像）
    if (item.avatar) {
      console.log(`处理 avatar: ${item.avatar}`)
      item.avatar = processImageUrl(item.avatar, defaultParam)
    }
    
    console.log(`处理后的第 ${index + 1} 项:`, item)
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
  
  return items.map(item => {
    if (item.audioUrl) {
      // 音频 URL 暂时保持原样，因为可能需要后端处理
      item.audioUrl = item.audioUrl
    }
    return item
  })
} 