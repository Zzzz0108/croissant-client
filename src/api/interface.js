// 定义数据结构，用于代码提示和文档
export const PlaylistSong = {
  songId: 0,
  songName: '',
  artistName: '',
  album: '',
  duration: '',
  coverUrl: null,
  audioUrl: '',
  likeStatus: 0,
  releaseTime: null
}

export const PlaylistComment = {
  commentId: 0,
  username: '',
  userAvatar: null,
  content: '',
  createTime: '',
  likeCount: 0
}

export const PlaylistDetail = {
  playlistId: 0,
  title: '',
  coverUrl: null,
  introduction: '',
  songs: [],
  likeStatus: 0,
  comments: [],
  isCollected: false
}

// 导出 Song 类型
export const Song = {
  songId: 0,
  songName: '',
  artistName: '',
  album: '',
  duration: '',
  coverUrl: '',
  audioUrl: '',
  likeStatus: 0,
  releaseTime: ''
}

export const Comment = {
  commentId: 0,
  username: '',
  userAvatar: null,
  content: '',
  createTime: '',
  likeCount: 0
}

export const SongDetail = {
  songId: 0,
  songName: '',
  artistName: '',
  album: '',
  lyric: null,
  duration: '',
  coverUrl: '',
  audioUrl: '',
  releaseTime: '',
  likeStatus: null,
  comments: []
}

// 用于运行时类型检查的辅助函数
export const isPlaylistSong = (obj) => {
  return obj && typeof obj.songId === 'number' && typeof obj.songName === 'string'
}

export const isSong = (obj) => {
  return obj && typeof obj.songId === 'number' && typeof obj.songName === 'string'
}

export const isPlaylistDetail = (obj) => {
  return obj && typeof obj.playlistId === 'number' && typeof obj.title === 'string'
} 