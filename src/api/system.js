import { http } from '@/utils/http'

// 定义返回结果的数据结构
export const Result = {
  code: 0,
  message: '',
  data: null
}

export const ResultTable = {
  code: 0,
  message: '',
  data: {
    /** 列表数据 */
    items: [],
    /** 总条目数 */
    total: 0,
    /** 每页显示条目个数 */
    pageSize: 0,
    /** 当前页数 */
    currentPage: 0
  }
}

/** 用户登录 */
export const login = (data) => {
  return http('post', '/user/login', { data })
}

/** 用户登出 */
export const logout = () => {
  return http('post', '/user/logout')
}

/** 发送邮箱验证码 */
export const sendEmailCode = (email) => {
  return http('get', '/user/sendVerificationCode', {
    params: { email },
  })
}

/** 用户注册 */
export const register = (data) => {
  return http('post', '/user/register', { data })
}

/** 重置密码 */
export const resetPassword = (data) => {
  return http('patch', '/user/resetUserPassword', { data })
}

/** 获取用户信息 */
export const getUserInfo = () => {
  return http('get', '/user/getUserInfo')
}

/** 更新用户信息 */
export const updateUserInfo = (data) => {
  return http('put', '/user/updateUserInfo', { data })
}

/** 更新用户头像 */
export const updateUserAvatar = (formData) => {
  return http('patch', '/user/updateUserAvatar', {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    transformRequest: [(data) => data], // 防止 axios 处理 FormData
  })
}

/** 注销账号 */
export const deleteUser = () => {
  return http('delete', '/user/deleteAccount')
}

/** 获取轮播图 */
export const getBanner = () => {
  return http('get', '/banner/getBannerList')
}

/** 获取推荐歌单 */
export const getRecommendedPlaylists = () => {
  return http('get', '/playlist/getRecommendedPlaylists')
}

/** 获取推荐歌曲 */
export const getRecommendedSongs = () => {
  return http('get', '/song/getRecommendedSongs')
}

/** 获取所有歌曲 */
export const getAllSongs = (data) => {
  return http('post', '/song/getAllSongs', { data })
}

/** 获取歌曲详情 */
export const getSongDetail = (id) => {
  return http('get', `/song/getSongDetail/${id}`)
}

/** 获取歌单详情 */
export const getPlaylistDetail = (id) => {
  return http('get', `/playlist/getPlaylistDetail/${id}`)
}

/** 获取歌单评论 */
export const getPlaylistComments = (id, page = 1, pageSize = 10) => {
  return http('get', `/playlist/getPlaylistComments/${id}`, {
    params: { page, pageSize }
  })
}

/** 添加歌单评论 */
export const addPlaylistComment = (playlistId, content) => {
  return http('post', '/playlist/addComment', {
    data: { playlistId, content }
  })
}

/** 获取歌曲评论 */
export const getSongComments = (id, page = 1, pageSize = 10) => {
  return http('get', `/song/getSongComments/${id}`, {
    params: { page, pageSize }
  })
}

/** 添加歌曲评论 */
export const addSongComment = (songId, content) => {
  return http('post', '/song/addComment', {
    data: { songId, content }
  })
}

/** 收藏歌曲 */
export const collectSong = (songId) => {
  return http('post', `/favorite/collectSong?songId=${songId}`)
}

/** 取消收藏歌曲 */
export const cancelCollectSong = (songId) => {
  return http('delete', `/favorite/cancelCollectSong?songId=${songId}`)
}

/** 获取收藏歌曲列表 */
export const getCollectedSongs = (page = 1, pageSize = 10) => {
  return http('post', '/favorite/getFavoriteSongs', {
    data: { page, pageSize }
  })
}

/** 收藏歌单 */
export const collectPlaylist = (playlistId) => {
  return http('post', `/favorite/collectPlaylist?playlistId=${playlistId}`)
}

/** 取消收藏歌单 */
export const cancelCollectPlaylist = (playlistId) => {
  return http('delete', `/favorite/cancelCollectPlaylist?playlistId=${playlistId}`)
}

/** 获取收藏歌单列表 */
export const getCollectedPlaylists = (page = 1, pageSize = 10) => {
  return http('get', '/playlist/getCollectedPlaylists', {
    params: { page, pageSize }
  })
}

/** 获取艺术家列表 */
export const getArtists = (page = 1, pageSize = 10) => {
  return http('get', '/artist/getArtists', {
    params: { page, pageSize }
  })
}

/** 获取所有艺术家（带筛选条件） */
export const getAllArtists = (params) => {
  return http('post', '/artist/getAllArtists', { data: params })
}

/** 获取艺术家详情 */
export const getArtistDetail = (id) => {
  return http('get', `/artist/getArtistDetail/${id}`)
}

/** 获取艺术家歌曲 */
export const getArtistSongs = (id, page = 1, pageSize = 10) => {
  return http('get', `/artist/getArtistSongs/${id}`, {
    params: { page, pageSize }
  })
}

/** 搜索歌曲 */
export const searchSongs = (keyword, page = 1, pageSize = 10) => {
  return http('get', '/song/searchSongs', {
    params: { keyword, page, pageSize }
  })
}

/** 搜索歌单 */
export const searchPlaylists = (keyword, page = 1, pageSize = 10) => {
  return http('get', '/playlist/searchPlaylists', {
    params: { keyword, page, pageSize }
  })
}

/** 搜索艺术家 */
export const searchArtists = (keyword, page = 1, pageSize = 10) => {
  return http('get', '/artist/searchArtists', {
    params: { keyword, page, pageSize }
  })
}

/** 提交反馈 */
export const addFeedback = (data) => {
  return http('post', '/feedback/add', { data })
}

/** 点赞评论 */
export const likeComment = (commentId) => {
  return http('post', '/comment/like', { data: { commentId } })
}

/** 删除评论 */
export const deleteComment = (commentId) => {
  return http('delete', `/comment/delete/${commentId}`)
}

/** 获取歌曲URL */
export const urlV1 = (songId) => {
  return http('get', `/song/url/${songId}`)
}

/** 获取所有歌单 */
export const getAllPlaylists = (params) => {
  return http('post', '/playlist/getAllPlaylists', { data: params })
}

/** 获取收藏歌单 */
export const getFavoritePlaylists = (params) => {
  return http('post', '/favorite/getFavoritePlaylists', { data: params })
}

/** 获取收藏歌曲 */
export const getFavoriteSongs = (params) => {
  return http('post', '/favorite/getFavoriteSongs', { data: params })
} 