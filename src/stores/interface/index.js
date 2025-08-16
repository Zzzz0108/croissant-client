// 定义数据结构，用于代码提示和文档

/* UserState */
export const UserState = {
  userInfo: {}, // 用户信息
  isLoggedIn: false // 是否登录
}

// user
export const userModel = {
  avatarUrl: '', // 头像
  username: '', // 用户名
  userId: 0, // 用户id
  token: '' // 用户token
}

/* AudioState*/
export const AudioState = {
  trackList: [], // 歌曲缓存
  currentSongIndex: 0, // 当前播放歌曲索引
  currentPageSongs: [], // 当前页面的歌曲列表
  volume: 50, // 音量
  quality: 'exhigh' // 音质
}

export const trackModel = {
  id: '', // 歌曲id
  title: '', // 歌曲名
  artist: '', // 艺术家
  album: '', // 专辑
  cover: '', // 封面
  url: '', // 音频地址
  duration: 0, // 时长
  likeStatus: 0
}

/* MenuState */
export const MenuState = {
  menuIndex: '1-0' // 当前菜单索引
}

/* SettingState */
export const SettingState = {
  isDrawerCover: true, // 是否覆盖抽屉
  isOriginalParsed: true, // 是否解析原文
  isRomaParsed: true, // 是否解析罗马音
  isTranslatedParsed: true, // 是否解析翻译
  language: null // 当前系统语言
}

/* ThemeState */
export const ThemeState = {
  isDark: false, // 是否暗黑模式
  primary: '#7E22CE' // 主题色
} 