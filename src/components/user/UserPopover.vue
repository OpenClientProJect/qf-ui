<template>
  <div class="user-popover-container">
    <el-popover
      v-model:visible="visible"
      :show-arrow="false"
      placement="bottom"
      :width="300"
      popper-class="user-popover"
      :offset="-10"
      transition="fade-transform"
    >
      <template #reference>
        <div class="user-avatar" 
             @mouseenter="handleMouseEnter" 
             @mouseleave="handleMouseLeave"
             :class="{ 'hidden': visible }">
          <el-avatar :size="42" :src="userInfo.userPic || defaultAvatar" />
        </div>
      </template>

      <!-- 用户信息内容 -->
      <div class="user-info-content"
           @mouseenter="handleMouseEnter" 
           @mouseleave="handleMouseLeave">
        <!-- 头像展示区域 -->
        <div class="avatar-showcase" @click="goToUserHome">
          <el-avatar :size="80" :src="userInfo.userPic || defaultAvatar" class="large-avatar" />
        </div>

        <!-- 用户基本信息 -->
        <div class="user-header">
          <div class="user-basic">
            <h3 class="username">{{ userInfo.nickname}}</h3>
          </div>
          <div class="user-stats">
            <div class="stat-item" @click="goToFollowList('follow')">
              <span class="num">{{ userInfo.followCount }}</span>
              <span class="label">关注</span>
            </div>
            <div class="stat-item" @click="goToFollowList('fans')">
              <span class="num">{{ userInfo.fansCount }}</span>
              <span class="label">粉丝</span>
            </div>
          </div>
        </div>

        <!-- 菜单列表 -->
        <div class="menu-list">
          <div class="menu-item" @click="goToUserCenter">
            <el-icon><User /></el-icon>
            个人中心
          </div>
          <div class="menu-item" @click="goToEditProfile">
            <el-icon><Edit /></el-icon>
            编辑资料
          </div>
          <div class="menu-item" @click="goToVideoManage">
            <el-icon><VideoCamera /></el-icon>
            投稿管理
          </div>
        </div>

        <!-- 退出登录 -->
        <div class="logout-btn" @click="handleLogout">
          退出登录
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { User, VideoCamera, Star, Edit } from '@element-plus/icons-vue'
import useUserInfoStore from '@/stores/userInfo'
import { useTokenStore } from '@/stores/token'
import { ElMessage } from 'element-plus'
import {getUserInfoService, logoutService} from "@/api/user/user"
import { useRouter } from 'vue-router'

const userInfoStore = useUserInfoStore()
const tokenStore = useTokenStore()
const visible = ref(false)
const router = useRouter()
const emits = defineEmits(['update:currentNav'])

// 鼠标悬停处理
const handleMouseEnter = () => {
  visible.value = true
}

// 鼠标离开处理
const handleMouseLeave = () => {
  visible.value = false
}

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const getUserInfo = async () => {
  let result = await getUserInfoService()
  // 将用户信息保存到 store 中
  userInfoStore.setInfo(result.data)
}

// 从 store 中获取用户信息
const userInfo = computed(() => {
  const info = userInfoStore.info
  if (info === null) {
    // 清除用户信息
    userInfoStore.removeInfo()
    // 清除token
    tokenStore.removeToken()
    return {}
  }
  return info
})
const handleLogout = async () => {
  await logoutService()
  // 清除用户信息
  userInfoStore.removeInfo()
  // 清除token
  tokenStore.removeToken()
  // 关闭弹窗
  visible.value = false
  // 跳转回首页
  await router.push('/')
  // 提示退出成功
  ElMessage.success('退出成功')
}

const goToUserCenter = () => {
  visible.value = false // 关闭弹窗
  router.push('/user-center')
}

// 添加跳转到关注和粉丝列表的方法
const goToFollowList = (type) => {
  visible.value = false // 关闭弹窗
  
  // 创建自定义事件来传递额外参数
  localStorage.setItem('openFollowDialog', type)
  
  // 跳转到个人中心
  router.push('/user-center')
}

const goToEditProfile = () => {
  visible.value = false // 关闭弹窗
  console.log('正在跳转到编辑资料页面...')
  
  // 通过URL参数直接指定要显示的页面
  router.push('/user-center?tab=edit-profile')
}

const goToVideoManage = () => {
  visible.value = false // 关闭弹窗
  console.log('正在跳转到投稿管理页面...')
  
  // 通过URL参数直接指定要显示的页面
  router.push('/user-center?tab=videos')
}

// 跳转到用户首页
const goToUserHome = () => {
  visible.value = false // 关闭弹窗
  router.push('/user')
}

getUserInfo()
</script>

<style scoped>
.user-popover-container {
  position: relative;
}

.user-avatar {
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  opacity: 1;
  visibility: visible;
}

.user-avatar.hidden {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
}

:deep(.user-popover) {
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-info-content {
  position: relative;
  padding-top: 50px;
  margin-top: -30px;
  animation: content-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar-showcase {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  animation: avatar-pop-in 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.large-avatar {
  border: 4px solid #fff;
}

.user-header {
  padding: 16px;
  text-align: center;
}

.user-basic {
  margin-bottom: 16px;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 8px;
  color: #18191c;
}

.user-level {
  color: #61666d;
  font-size: 14px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.stat-item:hover {
  background-color: #f9f9f9;
  transform: translateY(-2px);
}

.stat-item:hover:before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #fb7299;
  animation: slideIn 0.3s ease-out forwards;
}

.stat-item:active {
  transform: scale(0.95);
}

.stat-item .num {
  font-size: 16px;
  font-weight: bold;
  color: #18191c;
}

.stat-item .label {
  font-size: 12px;
  color: #61666d;
}

.stat-item:hover .num,
.stat-item:hover .label {
  color: #fb7299;
}

@keyframes slideIn {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

.vip-section {
  padding: 12px 16px;
  background-color: #fcfcfc;
  border-bottom: 1px solid #f0f0f0;
}

.vip-tag {
  background-color: #fb7299;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.vip-text {
  color: #61666d;
  font-size: 14px;
}

.menu-list {
  padding: 8px 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: #18191c;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  color: #fb7299;
}

.menu-item .el-icon {
  font-size: 18px;
}

.logout-btn {
  padding: 12px 0;
  text-align: center;
  color: #61666d;
  cursor: pointer;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
}

.logout-btn:hover {
  color: #fb7299;
}

/* 添加过渡效果 */
:deep(.fade-transform-enter-active),
:deep(.fade-transform-leave-active) {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.fade-transform-enter-from) {
  opacity: 0;
  transform: translateY(-20px);
}

:deep(.fade-transform-leave-to) {
  opacity: 0;
  transform: translateY(10px);
}

/* 添加动画关键帧 */
@keyframes content-fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes avatar-pop-in {
  0% {
    opacity: 0;
    transform: translate(-50%, 10px) scale(0.8);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, 5px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}
</style> 