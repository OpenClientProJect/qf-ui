<template>
  <div class="user-center" id="user-center">
    <!-- 顶部背景和用户信息 -->
    <div class="user-header">
      <div class="header-bg">
        <div class="bg-overlay"></div>
      </div>
      <div class="user-info-card">
        <div class="user-basic">
          <div class="avatar-wrap">
            <el-avatar :size="120" :src="userInfo.userPic || defaultAvatar"/>
            <div class="level-tag">LV6</div>
          </div>
          <div class="user-detail">
            <div class="name-row">
              <h1 class="username">{{ userInfo.nickname }}</h1>
              <el-button size="small" class="edit-btn" @click="goToEditProfile">
                <el-icon>
                  <Edit/>
                </el-icon>
                编辑资料
              </el-button>
            </div>
            <div class="user-id">账号: {{ userInfo.username }}</div>
            <div class="user-intro">个人简介：{{ userInfo.introduction || '这个人很懒什么都没写' }}</div>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-group">
            <div class="stat-item" v-for="stat in userStats" :key="stat.label" @click="stat.action && stat.action()">
              <div class="num">{{ stat.num }}</div>
              <div class="label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-wrap">
      <div class="content-main">
        <!-- 左侧导航 -->
        <div class="side-nav">
          <div class="nav-item"
               v-for="item in navItems"
               :key="item.name"
               :class="{ active: currentNav === item.name }"
               @click="handleNavClick(item)">
            <el-icon>
              <component :is="item.icon"></component>
            </el-icon>
            {{ item.label }}
            <span class="count" v-if="item.count">({{ item.count }})</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="main-content">
          <!-- 视频列表相关内容 -->
          <UserVideoContent v-if="currentNav === 'videos'" :videos="videos" @refresh="getUserVideos" />
          <EditProfileContent v-else-if="currentNav === 'edit-profile'" />
          <div v-else class="empty-state">
            <el-empty :description="getEmptyText">
              <template #description>
                <p class="empty-text">{{ getEmptyText }}</p>
              </template>
            </el-empty>
          </div>
        </div>
      </div>
    </div>

    <!-- 关注列表弹窗 -->
    <el-dialog
      v-model="followDialogVisible"
      width="500px"
      :close-on-click-modal="true"
      class="follow-dialog"
      center
    >
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="关注" name="follow">
          <div v-loading="followLoading" class="follow-list">
            <template v-if="followList.length > 0">
              <div v-for="user in followList" :key="user.id" class="follow-item">
                <div class="follow-avatar" @click="goToUserHome(user.username)" style="cursor: pointer;">
                  <el-avatar :size="50" :src="user.userPic || defaultAvatar" />
                </div>
                <div class="follow-info" @click="goToUserHome(user.username)" style="cursor: pointer;">
                  <div class="follow-name">{{ user.nickname }}</div>
                  <div class="follow-intro">{{ user.introduction || '这个人很懒什么都没写' }}</div>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无关注" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="粉丝" name="fans">
          <div v-loading="fansLoading" class="follow-list">
            <template v-if="fansList.length > 0">
              <div v-for="user in fansList" :key="user.id" class="follow-item">
                <div class="follow-avatar" @click="goToUserHome(user.username)" style="cursor: pointer;">
                  <el-avatar :size="50" :src="user.userPic || defaultAvatar" />
                </div>
                <div class="follow-info" @click="goToUserHome(user.username)" style="cursor: pointer;">
                  <div class="follow-name">{{ user.nickname }}</div>
                  <div class="follow-intro">{{ user.introduction || '这个人很懒什么都没写' }}</div>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无粉丝" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, computed, watch, defineExpose, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {Edit, Setting} from '@element-plus/icons-vue'
import useUserInfoStore from '@/stores/userInfo'
import {ElMessage} from "element-plus";
import {useTokenStore} from "@/stores/token";
import {getUserVideoService} from "@/api/userVideo";
import {getFollowListService, getFansListService} from "@/api/follow";
import EditProfileContent from '@/components/user/EditUserInformation.vue'
import UserVideoContent from '@/components/user/UserVideoContent.vue'

const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()
const currentNav = ref('videos')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
// token
const tokenStore = useTokenStore()

const userInfo = computed(() => userInfoStore.info)
const hasContent = computed(() => {
  return videos.value.length > 0;
});

const baseNavItems = [
  {name: 'videos', label: '视频', icon: 'VideoCamera', count: 0},
  {name: 'edit-profile', label: '编辑资料', icon: 'Edit'}
]

// 根据用户角色动态计算导航项
const navItems = computed(() => {

  return baseNavItems
})

// 关注列表相关数据
const followDialogVisible = ref(false)
const followList = ref([])
const followLoading = ref(false)
const fansList = ref([])
const fansLoading = ref(false)
const activeTab = ref('follow')

// 打开关注/粉丝列表弹窗
const openFollowDialog = () => {
  activeTab.value = 'follow'
  followDialogVisible.value = true
  if (followList.value.length === 0) {
    getFollowList()
  }
}

const openFansDialog = () => {
  activeTab.value = 'fans'
  followDialogVisible.value = true
  if (fansList.value.length === 0) {
    getFansList()
  }
}

// 获取关注列表
const getFollowList = async () => {
  followLoading.value = true
  try {
    const result = await getFollowListService(userInfo.value.id)
    followList.value = result.data
  } catch (error) {
    console.error('获取关注列表失败:', error)
    ElMessage.error('获取关注列表失败，请稍后重试')
  } finally {
    followLoading.value = false
  }
}

// 获取粉丝列表
const getFansList = async () => {
  fansLoading.value = true
  try {
    const result = await getFansListService(userInfo.value.id)
    fansList.value = result.data
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    ElMessage.error('获取粉丝列表失败，请稍后重试')
  } finally {
    fansLoading.value = false
  }
}

// 处理Tab切换
const handleTabChange = (tab) => {
  // tab参数是el-tabs的事件对象，需要获取tab.props.name
  const tabName = tab.props.name;
  if (tabName === 'follow' && followList.value.length === 0) {
    getFollowList()
  } else if (tabName === 'fans' && fansList.value.length === 0) {
    getFansList()
  }
}

// 监听标签页变化，自动加载数据
watch(activeTab, (newTab) => {
  if (newTab === 'follow' && followList.value.length === 0) {
    getFollowList();
  } else if (newTab === 'fans' && fansList.value.length === 0) {
    getFansList();
  }
});

const userStats = [
  {num: userInfo.value.followCount, label: '关注', action: openFollowDialog},
  {num: userInfo.value.fansCount, label: '粉丝', action: openFansDialog},
]

const getEmptyText = computed(() => {
  const texts = {
    videos: '还没有发布过视频哦',
    anime: '还没有发布过番剧哦',
    favorites: '还没有收藏任何内容',
    likes: '还没有点赞过内容',
    articles: '还没有发布过专栏文章',
    comments: '还没有发表过评论'
  }
  return texts[currentNav.value]
})

//视频区域数据模型
const videos = ref([]);
//分页相关的数据
const pagination = ref({
  pageNum: 1,
  pageSize: 5,
  total: 0
})

//获取用视频信息
const getUserVideoInfo = async () => {
  let result = await getUserVideoService({
    pageNum: pagination.value.pageNum,
    pageSize: pagination.value.pageSize
  });
  videos.value = result.data.items;
  pagination.value.total = result.data.total;
}

// 获取用户视频信息
getUserVideoInfo()

// 添加新的响应式变量
const videoFileName = ref('')

// 修改"编辑资料"按钮的点击处理方法
const goToEditProfile = () => {
  currentNav.value = 'edit-profile'
  router.replace({
    query: { ...route.query, tab: 'edit-profile' }
  }).catch(err => {
    console.error('更新URL参数失败:', err)
  })
}

// 修改导航项点击处理方法，使其也更新URL参数
const handleNavClick = (item) => {
  currentNav.value = item.name
  
  router.replace({
    query: { ...route.query, tab: item.name }
  }).catch(err => {
    console.error('更新URL参数失败:', err)
  })
}

const currentAnimeId = ref(null)

const handleAnimeSelect = (animeId) => {
  currentAnimeId.value = animeId
}

const handleBackToAnimeList = () => {
  currentAnimeId.value = null
}

// 添加defineExpose，暴露currentNav
defineExpose({
  currentNav
})

// 添加onMounted钩子，在组件挂载后打印调试信息
onMounted(() => {
  console.log('UserCenter组件已挂载')
  const userCenterEl = document.querySelector('#user-center')
  console.log('UserCenter DOM元素:', userCenterEl)
  
  // 从URL查询参数中读取tab
  const tabParam = route.query.tab
  if (tabParam) {
    // 验证tab参数是否有效
    const validTabs = navItems.value.map(item => item.name)
    if (validTabs.includes(tabParam)) {
      currentNav.value = tabParam
    } else {
      console.warn('无效的tab参数:', tabParam)
    }
  }
  
  // 检查localStorage中是否有打开关注/粉丝列表的标记
  const openFollowDialogType = localStorage.getItem('openFollowDialog')
  if (openFollowDialogType) {
    // 根据标记类型打开对应弹窗
    if (openFollowDialogType === 'follow') {
      openFollowDialog()
      activeTab.value = 'follow'
    } else if (openFollowDialogType === 'fans') {
      openFansDialog()
      activeTab.value = 'fans'
    }
    // 清除标记，防止重复触发
    localStorage.removeItem('openFollowDialog')
  }
})

// 监听路由变化，以便在URL参数改变时更新导航
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    const validTabs = navItems.value.map(item => item.name)
    if (validTabs.includes(newTab)) {
      console.log('路由参数变化，设置currentNav为:', newTab)
      currentNav.value = newTab
    }
  }
})

// 添加跳转方法
const goToUserHome = (username) => {
  followDialogVisible.value = false // 关闭弹窗
  router.push({
    path: '/user',
    query: { username }
  })
}
</script>

<style scoped>
.user-center {
  min-height: 100vh;
  background-color: #f1f2f3;
}

.user-header {
  position: relative;
  height: 280px; /* 增加高度 */
  color: #18191c;
  margin-bottom: 20px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(to bottom, #f6f7f8, #fff);
}

.user-info-card {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px; /* 设置最小高度 */
}

.user-basic {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 0;
  position: relative;
  z-index: 2;
  padding-top: 20px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  margin-bottom: 0;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-wrap :deep(.el-avatar) {
  border: 4px solid #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.level-tag {
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6699;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-detail {
  flex: 1;
  min-width: 0;
  color: #18191c;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.username {
  font-size: 26px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  color: #18191c;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: 4px;
  background: #f4f5f7;
  border: 1px solid #e3e5e7;
  color: #61666d;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn:hover {
  background: #fb7299;
  border-color: #fb7299;
  color: #fff;
}

.edit-btn  {
  font-size: 14px;
}

.user-id {
  font-size: 18px;
  color: #61666d;
  margin-bottom: 11px;
}

.user-intro {
  font-size: 14px;
  color: #61666d;
  max-width: 600px;
  line-height: 1.5;
}

.user-stats {
  border-top: 1px solid #e3e5e7;
  padding-top: 16px;
  position: relative;
  z-index: 2;
  margin-top: 20px;
  margin-bottom: 20px; /* 增加底部间距 */
  text-align: center;
}

.stat-group {
  display: flex;
  gap: 60px;
  justify-content: center;
  padding-bottom: 16px;
}

.stat-item {
  text-align: center;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-in-out;
  cursor: pointer;
}

.stat-item .num {
  font-size: 22px;
  font-weight: bold;
  color: #18191c;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-item .label {
  font-size: 13px;
  color: #61666d;
  line-height: 1;
}

.nav-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e3e5e7;
}

.nav-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e3e5e7;
}

.nav-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 24px;
  height: 46px;
  line-height: 46px;
  color: #61666d;
}

.nav-tabs :deep(.el-tabs__item.is-active) {
  color: #18191c;
  font-weight: bold;
}

.nav-tabs :deep(.el-tabs__active-bar) {
  background-color: #18191c;
}

.content-wrap {
  background: #fff;
  min-height: calc(100vh - 364px);
  width: 100%;
}

.content-main {
  width: 100%;
  max-width: 100%;
  padding: 20px;
  display: flex;
  gap: 24px;
  justify-content: flex-start;
}

.side-nav {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  position: sticky;
  top: 84px;
  align-self: flex-start;
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
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);


  &:hover {
    background: #f6f7f8;
    color: #fb7299;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.active {
    background: #fff1f5;
    color: #fb7299;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.count {
  font-size: 12px;
  color: #999; /* 调整计数颜色以便于阅读 */
  margin-left: 4px;
}


.main-content {
  flex: 1;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  max-width: calc(100% - 224px); /* 200px侧边栏 + 24px间距 */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.empty-text {
  color: #666;
  font-size: 14px;
  margin: 16px 0;
}

:deep(.el-button--primary) {
  background: #fb7299;
  border-color: #fb7299;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary:hover) {
  background: #fc8bab;
  border-color: #fc8bab;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header {
    height: 200px;
  }

  .user-info-card {
    padding: 10px 20px;
  }

  .user-basic {
    gap: 16px;
  }

  .username {
    font-size: 20px;
  }

  .user-stats {
    padding-top: 12px;
    margin-top: 15px;
  }

  .stat-group {
    gap: 30px;
  }

  .stat-item .num {
    font-size: 18px;
  }

  .content-wrap {
    min-height: calc(100vh - 300px);
  }

  .content-main {
    flex-direction: column;
    padding: 12px;
  }

  .side-nav {
    width: 100%;
    position: static;
  }

  .main-content {
    max-width: 100%;
    min-height: 300px;
    padding: 16px;
  }
}

/* 响应式布局 */
@media (max-width: 768px) {

  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  :deep(.el-dropdown-menu__item:hover) {
    color: #fb7299;
    background-color: #fff1f5;
  }

  :deep(.el-dropdown-menu__item .el-icon) {
    margin-right: 4px;
  }

  :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
    background-color: #fb7299;
  }

  :deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
    color: #fb7299;
  }

  .cover-uploader :deep(.el-upload) {
    width: 178px;
    height: 178px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
  }

  .cover-uploader :deep(.el-upload:hover) {
    border-color: #fb7299;
  }
}

/* 关注/粉丝列表弹窗样式 */
.follow-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
  margin-right: 0;
  text-align: center;
}

.follow-dialog :deep(.el-dialog__headerbtn) {
  top: 16px;
}

.follow-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}

.follow-dialog :deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 20px;
  background-color: #f9f9f9;
}

.follow-dialog :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #f0f0f0;
}

.follow-dialog :deep(.el-tabs__item) {
  font-size: 15px;
  height: 50px;
  line-height: 50px;
  color: #666;
}

.follow-dialog :deep(.el-tabs__item.is-active) {
  color: #fb7299;
  font-weight: bold;
}

.follow-dialog :deep(.el-tabs__active-bar) {
  background-color: #fb7299;
}

.follow-list {
  padding: 0;
  min-height: 200px;
}

.follow-item {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.3s ease;
}

.follow-item:hover {
  background-color: #f9f9f9;
}

.follow-avatar {
  margin-right: 16px;
}

.follow-info {
  flex: 1;
  min-width: 0;
}

.follow-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-intro {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.follow-action .el-button--primary {
  background-color: #fff;
  color: #fb7299;
  border-color: #fb7299;
}

.follow-action .el-button--primary:hover {
  background-color: #fb7299;
  color: #fff;
}

</style>
