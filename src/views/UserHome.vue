<template>
  <div class="user-home">
    <!-- 顶部背景和用户信息 -->
    <div class="user-header">
      <div class="header-bg">
        <div class="bg-image" :style="{ backgroundImage: `url(${bgImage})` }"></div>
        <div class="bg-overlay"></div>
      </div>
      <div class="user-info-card">
        <div class="user-basic">
          <div class="avatar-wrap">
            <el-avatar :size="120" :src="userHomeInfo.userPic || defaultAvatar"/>
          </div>
          <div class="user-detail">
            <h1 class="username">{{ userHomeInfo.nickname }}</h1>
            <div class="user-stats">
              <div class="stat-item">
                <span class="num">{{ userHomeInfo.followCount || 0 }}</span>
                <span class="label">关注</span>
              </div>
              <div class="stat-item">
                <span class="num">{{ userHomeInfo.fansCount || 0 }}</span>
                <span class="label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="num">{{ userHomeInfo.videoCount || 0 }}</span>
                <span class="label">投稿</span>
              </div>
            </div>
            <div class="user-sign">{{ userHomeInfo.introduction || '这个人很懒，什么都没写~' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户内容区域 -->
    <div class="user-content">
      <div class="content-tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'videos' }"
          @click="switchTab('videos')"
        >
          <img :src="videoIcon" alt="视频">Ta发布的视频
        </div>
        <div
          class="tab" 
          :class="{ active: activeTab === 'favorites' }"
          @click="switchTab('favorites')"
        >
          <img :src="starIcon" alt="收藏">收藏
        </div>
        <div
          class="tab" 
          :class="{ active: activeTab === 'likes' }"
          @click="switchTab('likes')"
        >
          <img :src="likeIcon" alt="点赞">点赞
        </div>
        <div
          class="tab" 
          :class="{ active: activeTab === 'history' }"
          @click="switchTab('history')"
        >
          <img :src="Record" alt="播放记录">播放记录
        </div>
      </div>
      <!-- 视频列表 -->
      <div v-if="activeTab === 'videos'">
        <div class="video-list" v-if="userHomeInfo.videos && userHomeInfo.videos.length > 0">
          <div v-for="video in userHomeInfo.videos" 
                :key="video.id" 
                class="video-item"
                @click="goToVideo(video.id)">
            <div class="video-cover">
              <img :src="video.cover" :alt="video.title">
              <span class="duration">{{ video.duration }}</span>
            </div>
            <div class="video-info">
              <div class="video-title">{{ video.title }}</div>
              <div class="video-stats">
                <span>{{ video.viewCount }}播放</span>
                <span class="dot">·</span>
                <span>{{ formatDate(video.createTime)}}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无视频"/>
      </div>
      <!-- 动态列表 -->
      <div v-if="activeTab === 'dynamics'">
        <el-empty description="暂无动态" />
      </div>
      <!-- 收藏列表 -->
      <div v-if="activeTab === 'favorites'">
        <div v-loading="loadingCollections">
          <div class="video-list" v-if="collectionList.length > 0">
            <div v-for="video in collectionList" 
                  :key="video.id" 
                  class="video-item"
                  @click="goToVideo(video.id)">
              <div class="video-cover">
                <img :src="video.cover" :alt="video.title">
                <!-- 播放时长暂时不显示，因为API没有返回该字段 -->
              </div>
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-stats">
                  <span>{{ formatDate(video.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无收藏视频" />
        </div>
      </div>
      <!-- 点赞列表 -->
      <div v-if="activeTab === 'likes'">
        <div v-loading="loadingLikes">
          <div class="video-list" v-if="likeList.length > 0">
            <div v-for="video in likeList" 
                  :key="video.id" 
                  class="video-item"
                  @click="goToVideo(video.id)">
              <div class="video-cover">
                <img :src="video.cover" :alt="video.title">
              </div>
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-stats">
                  <span>{{ formatDate(video.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无点赞视频" />
        </div>
      </div>
      <!-- 播放记录列表 -->
      <div v-if="activeTab === 'history'">
        <div v-loading="loadingHistory">
          <div class="video-list" v-if="historyList.length > 0">
            <div v-for="video in historyList" 
                  :key="video.id" 
                  class="video-item"
                  @click="goToVideo(video.id)">
              <div class="video-cover">
                <img :src="video.cover" :alt="video.title">
              </div>
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-stats">
                  <span>{{ formatDate(video.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无播放记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import {userHomeService} from '@/api/user/user'
import {useRouter, useRoute} from 'vue-router'
import bgImage from '@/assets/background/background.webp' // 导入背景图片
//图标
import videoIcon from '@/assets/iconsvg/video.svg'
import starIcon from '@/assets/iconsvg/userstar.svg'
import likeIcon from '@/assets/iconsvg/点赞.svg'
import Record from '@/assets/iconsvg/Record.svg'
import useUserInfoStore from '@/stores/userInfo'
import { getUserCollectionService } from '@/api/user/uservideo'
import { getUserLikeService } from '@/api/vidoelike'
import { getVideoRecordListService } from '@/api/user/videorecord' // 导入获取播放记录的API
import { ElMessage } from 'element-plus'
import {formatDate} from "@/utils/format";

const userHomeInfo = ref({})
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const router = useRouter()
const route = useRoute()
const userInfoStore = useUserInfoStore()

// 添加收藏相关的状态
const activeTab = ref('videos') // 当前激活的标签：videos, dynamics, favorites
const collectionList = ref([]) // 收藏列表
const loadingCollections = ref(false) // 加载状态

// 添加点赞相关的状态
const likeList = ref([])
const loadingLikes = ref(false)

// 添加播放记录相关的状态
const historyList = ref([])
const loadingHistory = ref(false)

// 获取用户首页信息
const getUserHomeInfo = async () => {
  try {
    // 如果有 username 查询参数，说明是查看其他用户的主页
    if (route.query.username) {
      console.log('正在查看其他用户的主页:', route.query.username)
      const res = await userHomeService({ username: route.query.username })
      userHomeInfo.value = res.data
    } else {
      // 否则获取当前登录用户的信息
      console.log('正在查看自己的主页，store中的用户信息:', userInfoStore.info)
      const res = await userHomeService(null)
      userHomeInfo.value = res.data
    }
  } catch (error) {
    console.error('获取用户主页信息失败:', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  }
}

// 跳转到视频播放页
const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// 获取收藏列表
const getCollectionList = async () => {
  loadingCollections.value = true
  try {
    // 判断是否查看的是自己的主页
    const isOwnProfile = !route.query.username
    let userId = null
    
    // 如果是查看自己的主页，优先使用store中的用户ID
    if (isOwnProfile && userInfoStore.info && userInfoStore.info.id) {
      userId = userInfoStore.info.id
      console.log('从store获取当前用户ID:', userId)
    } else {
      // 否则使用页面上的用户信息或路由参数
      userId = userHomeInfo.value.id || route.query.username
      console.log('使用页面用户ID或路由参数:', userId)
    }
    
    if (!userId) {
      ElMessage.warning('无法获取用户ID')
      collectionList.value = []
      return
    }
    
    const res = await getUserCollectionService(userId)
    console.log('收藏列表API返回数据:', res)
    
    if (res && res.code === 200 && res.data) {
      collectionList.value = res.data
    } else {
      collectionList.value = []
      // 只在主动切换到收藏标签时显示提示
      if (activeTab.value === 'favorites') {
        ElMessage.info(res?.message || '暂无收藏内容')
      }
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error('获取收藏列表失败，请稍后重试')
    collectionList.value = []
  } finally {
    loadingCollections.value = false
  }
}

// 获取点赞列表
const getLikeList = async () => {
  loadingLikes.value = true
  try {
    // 判断是否查看的是自己的主页
    const isOwnProfile = !route.query.username
    let userId = null
    
    // 如果是查看自己的主页，优先使用store中的用户ID
    if (isOwnProfile && userInfoStore.info && userInfoStore.info.id) {
      userId = userInfoStore.info.id
      console.log('从store获取当前用户ID:', userId)
    } else {
      // 否则使用页面上的用户信息或路由参数
      userId = userHomeInfo.value.id || route.query.username
      console.log('使用页面用户ID或路由参数:', userId)
    }
    
    if (!userId) {
      ElMessage.warning('无法获取用户ID')
      likeList.value = []
      return
    }
    
    const res = await getUserLikeService(userId)
    console.log('点赞列表API返回数据:', res)
    
    if (res && res.code === 200 && res.data) {
      likeList.value = res.data
    } else {
      likeList.value = []
      // 只在主动切换到点赞标签时显示提示
      if (activeTab.value === 'likes') {
        ElMessage.info(res?.message || '暂无点赞内容')
      }
    }
  } catch (error) {
    console.error('获取点赞列表失败:', error)
    ElMessage.error('获取点赞列表失败，请稍后重试')
    likeList.value = []
  } finally {
    loadingLikes.value = false
  }
}

// 获取播放记录列表
const getHistoryList = async () => {
  loadingHistory.value = true
  try {
    let username = null
    
    // 判断是否查看的是自己的主页
    const isOwnProfile = !route.query.username
    
    // 如果是查看自己的主页，优先使用store中的用户名
    if (isOwnProfile && userInfoStore.info && userInfoStore.info.username) {
      username = userInfoStore.info.username
      console.log('从store获取当前用户名:', username)
    } else {
      // 否则使用路由参数
      username = route.query.username
      console.log('使用路由参数中的用户名:', username)
    }
    
    if (!username) {
      ElMessage.warning('无法获取用户名')
      historyList.value = []
      return
    }
    
    const res = await getVideoRecordListService(username)
    console.log('播放记录API返回数据:', res)
    
    if (res && res.code === 200 && res.data) {
      historyList.value = res.data
    } else {
      historyList.value = []
      // 只在主动切换到播放记录标签时显示提示
      if (activeTab.value === 'history') {
        ElMessage.info(res?.message || '暂无播放记录')
      }
    }
  } catch (error) {
    console.error('获取播放记录失败:', error)
    ElMessage.error('获取播放记录失败，请稍后重试')
    historyList.value = []
  } finally {
    loadingHistory.value = false
  }
}

// 修改切换标签的方法
const switchTab = (tabName) => {
  activeTab.value = tabName
  
  // 根据不同的标签加载相应的数据
  if (tabName === 'favorites') {
    if (collectionList.value.length === 0 || (!route.query.username && userInfoStore.info.id)) {
      getCollectionList()
    }
  } else if (tabName === 'likes') {
    if (likeList.value.length === 0 || (!route.query.username && userInfoStore.info.id)) {
      getLikeList()
    }
  } else if (tabName === 'history') {
    if (historyList.value.length === 0) {
      getHistoryList()
    }
  }
}

onMounted(() => {
  getUserHomeInfo()
  
  // 默认加载视频标签内容
  activeTab.value = 'videos'
})

// 监听路由参数变化
watch(() => route.query.username, (newUsername) => {
  if (newUsername) {
    getUserHomeInfo()
  }
}, { immediate: true })

</script>

<style scoped>
.user-home {
  min-height: 100vh;
  background: #f6f7f8;
  margin-top: -64px;
}

.user-header {
  position: relative;
  height: 240px;
  overflow: hidden;
  padding-top: 64px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: all 0.3s ease;
  transform: scale(1.1);
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
}

.user-info-card {
  position: relative;
  margin-left: 40px;
  padding: 20px 20px 40px;
  color: #fff;
}

.user-basic {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 40px;
}

.avatar-wrap {
  position: relative;
}

.user-detail {
  flex: 1;
  margin-bottom: 20px;
}

.username {
  font-size: 28px;
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .num {
  font-size: 24px;
  font-weight: bold;
}

.stat-item .label {
  font-size: 14px;
  opacity: 0.8;
}

.user-sign {
  font-size: 14px;
  opacity: 0.9;
}

.user-content {
  margin: 0 auto;
  width: 100%;
}

.content-tabs {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e3e5e7;
  max-width: 1200px;
  margin-left: 40px;
}

.tab {
  padding: 12px 0;
  font-size: 16px;
  color: #61666d;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab img {
  width: 35px;
  height: 30px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.tab:hover img {
  opacity: 0.8;
}

.tab.active img {
  opacity: 1;
}

.tab.active {
  color: #18191c;
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #fb7299;
}

.video-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
  padding: 0 40px;
}

.video-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
}

.video-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover {
  position: relative;
  padding-top: 56.25%;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  color: #18191c;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-stats {
  font-size: 12px;
  color: #9499a0;
}

.dot {
  margin: 0 6px;
}

@media screen and (max-width: 1700px) {
  .video-list {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media screen and (max-width: 1400px) {
  .video-list {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

@media screen and (max-width: 1200px) {
  .content-tabs {
    margin-left: 30px;
  }
  .user-info-card {
    margin-left: 30px;
  }
  .video-list {
    padding: 0 30px;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media screen and (max-width: 992px) {
  .video-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

@media screen and (max-width: 768px) {
  .user-header {
    height: 180px;
  }

  .user-basic {
    margin-top: 20px;
    flex-direction: column;
    text-align: center;
  }

  .user-stats {
    justify-content: center;
  }

  .content-tabs {
    gap: 16px;
    margin-left: 15px;
  }

  .video-list {
    padding: 0 15px;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
  }

  .user-info-card {
    margin-left: 15px;
    padding: 15px 15px 25px;
  }

  .video-title {
    font-size: 10px;
  }

  .video-stats {
    font-size: 11px;
  }
}
</style> 