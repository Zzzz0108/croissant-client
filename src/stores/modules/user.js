import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'
import { login, logout, register, getUserInfo } from '@/api/system'
import { AudioStore } from './audio'

/**
 * 用户信息
 */
export const UserStore = defineStore('UserStore', {
  state: () => ({
    userInfo: {},
    isLoggedIn: false,
    tempToken: null, // 临时存储登录过程中的token
  }),
  getters: {
    // 检查用户是否真正登录
    isAuthenticated: (state) => {
      return !!(state.isLoggedIn && state.userInfo && state.userInfo.userId && state.userInfo.token)
    },
    // 检查用户角色
    userRole: (state) => {
      return state.userInfo?.role || null
    },
    // 检查是否是普通用户
    isUser: (state) => {
      return state.userInfo?.role === 'ROLE_USER'
    },
    // 检查是否是管理员
    isAdmin: (state) => {
      return state.userInfo?.role === 'ROLE_ADMIN'
    },
    // 检查是否有特定API的权限
    hasApiPermission: (state) => (apiPath) => {
      const role = state.userInfo?.role
      if (!role) return false
      
      // 根据API路径和角色判断权限
      if (apiPath.includes('/playlist/getCollectedPlaylists')) {
        return role === 'ROLE_USER' || role === 'ROLE_ADMIN'
      }
      if (apiPath.includes('/admin/')) {
        return role === 'ROLE_ADMIN'
      }
      return true // 默认允许访问
    }
  },
  actions: {
    // 解析JWT Token
    parseJWTToken(token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        
        const payload = JSON.parse(jsonPayload)
        console.log('🔐 JWT Token解析结果:', payload)
        console.log('🔐 JWT Claims详情:', {
          role: payload.claims?.role,
          userId: payload.claims?.userId,
          email: payload.claims?.email,
          username: payload.claims?.username,
          exp: payload.exp,
          expDate: new Date(payload.exp * 1000).toLocaleString()
        })
        return payload
      } catch (error) {
        console.error('JWT Token解析失败:', error)
        return null
      }
    },
    // 初始化时检查状态
    init() {
      console.log('用户Store初始化，当前状态:', {
        userInfo: this.userInfo,
        isLoggedIn: this.isLoggedIn,
        isAuthenticated: this.isAuthenticated,
        userRole: this.userRole,
        isUser: this.isUser,
        isAdmin: this.isAdmin
      })
      
      // 检查localStorage中的状态
      const storedData = localStorage.getItem('UserStore')
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          console.log('localStorage中的用户数据:', parsed)
        } catch (error) {
          console.error('解析localStorage数据失败:', error)
        }
      }
    },
    // 设置用户信息
    setUserInfo(userInfo, token) {
      console.log('设置用户信息 - 完整数据:', userInfo)
      console.log('设置用户信息 - Token:', token)
      console.log('设置用户信息 - 角色字段:', userInfo.role)
      
      // 解析JWT Token获取角色信息
      const jwtPayload = this.parseJWTToken(token)
      const roleFromJWT = jwtPayload?.claims?.role
      console.log('从JWT获取的角色信息:', roleFromJWT)
      
      this.userInfo = {
        userId: userInfo.userId,
        username: userInfo.username,
        phone: userInfo.phone,
        email: userInfo.email,
        avatarUrl: userInfo.avatarUrl || userInfo.userAvatar, // 支持两种字段名
        introduction: userInfo.introduction,
        role: roleFromJWT || userInfo.role, // 优先使用JWT中的角色信息
        token: token // 直接使用传入的token
      }
      this.isLoggedIn = true
      
      console.log('用户状态已更新:', this.userInfo, this.isLoggedIn)
      console.log('验证状态 - isAuthenticated:', this.isAuthenticated)
      console.log('角色信息 - userRole:', this.userRole)
      console.log('角色检查 - isUser:', this.isUser)
      console.log('角色检查 - isAdmin:', this.isAdmin)
    },
    // 更新头像
    updateUserAvatar(avatarUrl) {
      console.log('🎵 开始更新头像:', {
        oldAvatarUrl: this.userInfo?.avatarUrl,
        newAvatarUrl: avatarUrl,
        userInfoExists: !!this.userInfo
      })
      
      if (this.userInfo) {
        this.userInfo.avatarUrl = avatarUrl
        console.log('🎵 头像更新完成:', {
          newAvatarUrl: this.userInfo.avatarUrl,
          fullUserInfo: this.userInfo
        })
      } else {
        console.error('🎵 无法更新头像：userInfo 不存在')
      }
    },
    // 清除用户信息
    clearUserInfo() {
      console.log('开始清除用户信息...')
      console.log('清除前状态:', {
        userInfo: this.userInfo,
        isLoggedIn: this.isLoggedIn,
        tempToken: this.tempToken
      })
      
      this.userInfo = {}
      this.isLoggedIn = false
      this.tempToken = null

      // 清除localStorage中的用户数据
      localStorage.removeItem('UserStore')
      console.log('localStorage已清除')

      // 清空所有歌曲的喜欢状态
      const audioStore = AudioStore()
      // 清空播放列表中的喜欢状态
      audioStore.trackList.forEach(track => {
        track.likeStatus = 0
      })
      // 清空当前页面歌曲列表中的喜欢状态
      if (audioStore.currentPageSongs) {
        audioStore.currentPageSongs.forEach(song => {
          song.likeStatus = 0
        })
      }
      
      console.log('清除后状态:', {
        userInfo: this.userInfo,
        isLoggedIn: this.isLoggedIn,
        tempToken: this.tempToken
      })
      console.log('用户信息清除完成')
    },
    // 用户登录
    async userLogin(loginData) {
      try {
        console.log('开始登录，登录数据:', loginData)
        const response = await login(loginData)
        console.log('登录响应:', response)

        if (response.code === 0) {
          // 先保存token到Store中，这样后续请求就能获取到token
          const token = response.data
          console.log('获取到token:', token)
          
          // 先设置临时token，这样getUserInfo就能获取到token
          this.tempToken = token
          console.log('临时Token已保存:', this.tempToken)
          
          try {
            // 再获取用户信息
            console.log('开始获取用户信息...')
            const userInfoResponse = await getUserInfo()
            console.log('用户信息响应:', userInfoResponse)
            
            if (userInfoResponse.code === 0) {
              console.log('用户信息获取成功，开始设置完整用户状态...')
              this.setUserInfo(userInfoResponse.data, token)
              // 确保token正确保存后再清理临时token
              console.log('登录完成，当前用户状态:', this.userInfo, this.isLoggedIn)
              console.log('最终保存的token:', this.userInfo.token)
              // 清理临时token
              this.tempToken = null
              return { success: true, message: '登录成功' }
            }
            console.error('获取用户信息失败:', userInfoResponse.message)
            return { success: false, message: userInfoResponse.message || '获取用户信息失败' }
          } catch (error) {
            console.error('获取用户信息异常:', error)
            return { success: false, message: error.message || '获取用户信息失败' }
          }
        }
        
        // 详细记录登录失败信息
        console.error('登录失败详情:', {
          code: response.code,
          message: response.message,
          data: response.data,
          fullResponse: response
        })
        return { success: false, message: response.message || '登录失败' }
      } catch (error) {
        console.error('登录异常:', error)
        return { success: false, message: error.message || '登录失败' }
      }
    },
    
    // 用户注册
    async userRegister(registerData) {
      try {
        console.log('开始注册，注册数据:', registerData)
        const response = await register(registerData)
        console.log('注册响应:', response)

        if (response.code === 0) {
          console.log('注册成功')
          return { success: true, message: '注册成功，请登录' }
        }
        
        console.error('注册失败:', response.message)
        return { success: false, message: response.message || '注册失败' }
      } catch (error) {
        console.error('注册异常:', error)
        return { success: false, message: error.message || '注册失败' }
      }
    },
    // 用户退出
    async userLogout() {
      try {
        console.log('开始登出...')
        const response = await logout()
        console.log('登出响应:', response)
        
        // 无论后端是否成功，都清除前端状态
        console.log('开始清除用户信息...')
        this.clearUserInfo()
        console.log('用户信息已清除')
        
        if (response.code === 0) {
          return { success: true, message: '退出成功' }
        } else {
          console.warn('后端登出失败，但前端状态已清除:', response.message)
          return { success: true, message: '已退出登录' }
        }
      } catch (error) {
        console.error('登出异常，但清除前端状态:', error)
        // 即使请求失败也清除用户信息
        this.clearUserInfo()
        return { success: true, message: '已退出登录' }
      }
    },
    // 更新用户信息
    async updateUserProfile(userData) {
      try {
        const response = await updateUserInfo(userData)
        if (response.code === 0) {
          // 更新本地用户信息
          this.userInfo = { ...this.userInfo, ...userData }
          return { success: true, message: '更新成功' }
        }
        return { success: false, message: response.message || '更新失败' }
      } catch (error) {
        return { success: false, message: error.message || '更新失败' }
      }
    },
    // 更新用户头像
    async updateUserAvatarFile(formData) {
      try {
        const response = await updateUserAvatar(formData)
        if (response.code === 0) {
          // 更新本地头像URL
          this.updateUserAvatar(response.data)
          return { success: true, message: '头像更新成功' }
        }
        return { success: false, message: response.message || '头像更新失败' }
      } catch (error) {
        return { success: false, message: error.message || '头像更新失败' }
      }
    },
    // 注销账号
    async deleteUserAccount() {
      try {
        const response = await deleteUser()
        if (response.code === 0) {
          this.clearUserInfo()
          return { success: true, message: '账号注销成功' }
        }
        return { success: false, message: response.message || '账号注销失败' }
      } catch (error) {
        return { success: false, message: error.message || '账号注销失败' }
      }
    }
  },
  persist: piniaPersistConfig('UserStore')
}) 