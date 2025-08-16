import axios from 'axios'
import NProgress from '@/config/nprogress'
import 'nprogress/nprogress.css'
import { UserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: 'http://localhost:8080', // 设置为后端服务地址
  timeout: 20000, // 设置超时时间 20秒
  headers: {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 开启进度条
    NProgress.start()

    // 不需要添加token的请求
    if (config.url?.includes('/user/login') || 
        config.url?.includes('/user/register') || 
        config.url?.includes('/user/sendVerificationCode') ||
        config.url?.includes('/user/resetUserPassword')) {
      return config
    }

    // 从 pinia 中获取token
    const userStore = UserStore()
    console.log('用户Store状态:', {
      isLoggedIn: userStore.isLoggedIn,
      userInfo: userStore.userInfo,
      isAuthenticated: userStore.isAuthenticated,
      userRole: userStore.userRole,
      isUser: userStore.isUser,
      isAdmin: userStore.isAdmin,
      tempToken: userStore.tempToken
    })
    
    // 优先使用临时token，如果没有则使用用户信息中的token
    const token = userStore.tempToken || userStore.userInfo?.token
    console.log('从Store获取的Token:', token)

    if (token) {
      // 确保headers对象存在
      if (!config.headers) {
        config.headers = {}
      }
      // 添加Bearer前缀
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('Token不存在，请求可能失败')
    }

    // 调试信息
    console.log('请求URL:', config.url)
    console.log('请求头:', config.headers)
    console.log('最终Token:', token)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 关闭进度条
    NProgress.done()
    const { data } = response
    return data
  },
  (error) => {
    // 关闭进度条
    NProgress.done()

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 如果不是登录请求，则清除用户信息
          if (!error.config.url?.includes('/user/login')) {
            const userStore = UserStore()
            userStore.clearUserInfo()
            ElMessage.error('登录已过期，请重新登录')
          } else {
            ElMessage.error('邮箱或密码错误')
          }
          break
        case 403:
          console.error('403权限错误 - 请求URL:', error.config?.url)
          console.error('403权限错误 - 请求头:', error.config?.headers)
          console.error('403权限错误 - 响应数据:', error.response?.data)
          
          // 获取当前用户状态
          const userStore = UserStore()
          console.error('403权限错误 - 当前用户状态:', {
            isLoggedIn: userStore.isLoggedIn,
            userRole: userStore.userRole,
            isUser: userStore.isUser,
            isAdmin: userStore.isAdmin
          })
          
          // 根据不同的API提供更友好的错误提示
          const url = error.config?.url || ''
          if (url.includes('/favorite/getFavoritePlaylists')) {
            ElMessage.error('获取收藏歌单失败，请检查参数格式')
          } else if (url.includes('/favorite/')) {
            ElMessage.error('收藏相关操作失败，请检查参数')
          } else if (url.includes('/playlist/')) {
            ElMessage.error('歌单相关操作失败，请检查权限')
          } else {
            ElMessage.error(`没有权限访问: ${url}`)
          }
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error('网络错误')
      }
    } else {
      ElMessage.error('网络连接失败')
    }

    return Promise.reject(error)
  }
)

// HTTP请求方法
export const http = (method, url, config = {}) => {
  const { data, params, headers, transformRequest, ...restConfig } = config
  
  return instance({
    method,
    url,
    data,
    params,
    headers,
    transformRequest,
    ...restConfig
  })
}

export default instance 