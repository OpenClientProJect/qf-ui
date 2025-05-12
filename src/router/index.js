import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import UserCenter from '@/components/user/UserCenter.vue'
import SearchResult from '@/views/SearchResult.vue'
import MessageCenter from '@/views/MessageCenter.vue'
import { useTokenStore } from '@/stores/token'
import useUserInfoStore from '@/stores/userInfo'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: "/anime",
    name: 'Anime',
    component: () => import('@/views/Anime.vue')
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: SearchResult
  },
  {
    path: '/user-center',
    name: 'userCenter',
    component: UserCenter,
    meta: { requiresAuth: true }
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: () => import('@/components/video/VideoDetail.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/components/ResetPassword.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/UserChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'UserHome',
    component: () => import('@/views/UserHome.vue')
  },
  {
    path: '/announcement/:id',
    name: 'AnnouncementDetail',
    component: () => import('@/views/AnnouncementDetail.vue')
  },
  {
    path: '/messages',
    name: 'MessageCenter',
    component: MessageCenter,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore()
  const userInfoStore = useUserInfoStore()
  
  // 检查是否需要登录权限
  if (to.meta.requiresAuth && !tokenStore.token) {
    next('/') // 未登录时重定向到首页
  } 
  // 如果是管理员页面，检查用户是否为管理员
  else if (to.path === '/admin' && userInfoStore.info?.role !== 'admin') {
    next('/') // 非管理员重定向到首页
    // 可以添加提示信息
    ElMessage.error('您没有管理员权限')
  }
  else {
    next()
  }
})

export default router