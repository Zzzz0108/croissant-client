// 歌词解析相关功能（已注释，可根据需要启用）
// 如果需要启用歌词解析功能，请取消注释并修改相关代码

/*
// export function parseLyrics(lyricString) {
//     const lines = lyricString.split('\n')
//     const parsedLines = []

//     lines.forEach((line) => {
//         const matches = [...line.matchAll(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g)]
//         const lrc = line.replace(/\[.*?\]/g, '').trim() // 去除时间戳部分，保留歌词文本

//         if (matches.length && lrc) {
//             matches.forEach((match) => {
//                 const minutes = parseInt(match[1], 10)
//                 const seconds = parseInt(match[2], 10)
//                 const milliseconds =
//                     match[3].length === 3
//                         ? parseInt(match[3], 10)
//                         : parseInt(match[3], 10) * 10
//                 const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds
//                 parsedLines.push({ time: time, lrc })
//             })
//         }
//     })

//     return parsedLines
// }
*/ 