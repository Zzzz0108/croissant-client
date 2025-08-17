import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'

import { routerMode } from '@/config/env'

const routerModeConfig = {
  hash: () => createWebHashHistory(),
  history: () => createWebHistory(),
}

const router = createRouter({
  history: routerModeConfig[routerMode](),
  strict: false,
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/pages/index.vue'),
    },
    {
      path: '/library',
      component: () => import('@/pages/library/index.vue'),
    },
    {
      path: '/artist',
      component: () => import('@/pages/artist/index.vue'),
    },
    {
      path: '/artist/:id',
      component: () => import('@/pages/artist/[id].vue'),
      name: 'ArtistDetail',
    },
    {
      path: '/playlist',
      component: () => import('@/pages/playlist/index.vue'),
    },
    {
      path: '/playlist/:id',
      component: () => import('@/pages/playlist/[id].vue'),
    },
    {
      path: '/like',
      component: () => import('@/pages/like/index.vue'),
    },
    {
      path: '/user',
      component: () => import('@/pages/user/index.vue'),
    },
  ],
})

// 需要登录的路由
const protectedRoutes = ['/user', '/like']

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要登录
  if (protectedRoutes.includes(to.path)) {
    // 从localStorage获取用户状态
    const userStoreData = localStorage.getItem('UserStore')
    if (userStoreData) {
      try {
        const userData = JSON.parse(userStoreData)
        if (userData.isLoggedIn && userData.userInfo && userData.userInfo.userId) {
          next() // 已登录，允许访问
          return
        }
      } catch (error) {
        console.error('解析用户数据失败:', error)
      }
    }
    // 未登录，重定向到首页
    next('/')
    return
  }
  next() // 不需要登录的页面，直接通过
})

export default router 