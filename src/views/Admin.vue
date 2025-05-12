<template>
  <div class="admin-page">
    <!-- 未登录时显示登录界面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>管理员登录</h2>
          <p>请使用管理员账号登录系统</p>
        </div>
        <LoginDialog :redirect="false" @login-success="handleLoginSuccess"/>
      </div>
    </div>

    <!-- 已登录且是管理员时显示管理界面 -->
    <div v-else-if="isAdmin" class="admin-container">
      <!-- 管理界面顶部 -->
      <div class="admin-header">
        <h1 class="admin-title">管理员控制台</h1>
        <el-button type="danger" @click="handleLogout" class="logout-btn">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>

      <!-- 管理界面内容区 -->
      <div class="admin-content">
        <!-- 左侧导航 -->
        <div class="side-nav">
          <div class="nav-item"
              v-for="item in navItems"
              :key="item.name"
              :class="{ active: currentNav === item.name }"
              @click="currentNav = item.name">
            <el-icon>
              <component :is="item.icon"></component>
            </el-icon>
            {{ item.label }}
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="main-content">
          <AdminVideoManager v-if="currentNav === 'adminVideo'" />
          <AnnouncementManager v-else-if="currentNav === 'announcement'" />
          <HomeImageManager v-else-if="currentNav === 'HomeImg'" />
          <ActivityManager v-else-if="currentNav === 'activity'" />
        </div>
      </div>
    </div>

    <!-- 已登录但不是管理员时显示无权限提示 -->
    <div v-else class="no-permission">
      <el-result
        icon="error"
        title="无权限访问"
        sub-title="您的账户没有管理员权限，无法访问此页面"
      >
        <template #extra>
          <el-button type="primary" @click="goToHome">返回首页</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Film, Bell, PictureFilled, SwitchButton, Calendar } from '@element-plus/icons-vue'
import useUserInfoStore from '@/stores/userInfo'
import { useTokenStore } from '@/stores/token'
import LoginDialog from '@/components/LoginDialog.vue'
import AdminVideoManager from '@/components/admin/AdminVideoManager.vue'
import AnnouncementManager from '@/components/admin/AnnouncementManager.vue'
import HomeImageManager from '@/components/admin/HomeImageManager.vue'
import ActivityManager from '@/components/admin/ActivityManager.vue'

const router = useRouter()
const userInfoStore = useUserInfoStore()
const tokenStore = useTokenStore()

// 导航项
const currentNav = ref('adminVideo')
const navItems = [
  {name: 'adminVideo', label: '视频审核', icon: 'Film', count: 0},
  {name: 'announcement', label: '公告管理', icon: 'Bell', count: 0},
  {name: 'HomeImg', label: '首页图片管理', icon: 'PictureFilled', count: 0},
  {name: 'activity', label: '活动公告', icon: 'Calendar', count: 0}
]

// 计算属性：是否已登录
const isLoggedIn = computed(() => {
  return !!tokenStore.token
})

// 计算属性：是否为管理员
const isAdmin = computed(() => {
  return userInfoStore.info?.role === 'admin'
})

// 登录成功处理
const handleLoginSuccess = () => {
  // 如果不是管理员，显示提示
  if (!isAdmin.value) {
    ElMessage.error('您的账户没有管理员权限')
  } else {
    ElMessage.success('管理员登录成功')
  }
}

// 退出登录
const handleLogout = () => {
  tokenStore.removeToken()
  userInfoStore.clearUserInfo()
  ElMessage.success('退出登录成功')
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 组件挂载时检查用户状态
onMounted(() => {
  // 如果已登录但不是管理员，显示提示
  if (isLoggedIn.value && !isAdmin.value) {
    ElMessage.warning('当前账户没有管理员权限')
  }
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #f1f2f3;
  padding: 20px;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  max-width: 450px;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.admin-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.admin-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fb7299;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-title {
  font-size: 20px;
  margin: 0;
  font-weight: 600;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.admin-content {
  display: flex;
  min-height: 80vh;
}

.side-nav {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin-bottom: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.nav-item:hover {
  background: #f6f7f8;
  color: #fb7299;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-item.active {
  background: #fff1f5;
  color: #fb7299;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  overflow: auto;
}

.no-permission {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-content {
    flex-direction: column;
  }
  
  .side-nav {
    width: 100%;
    padding: 10px;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .main-content {
    padding: 10px;
  }
}
</style> 