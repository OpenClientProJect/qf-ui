<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import {getVideoListService} from "@/api/video";
import {getAnnouncementListService} from "@/api/Announcement";
import {getHomeImageService, getBackgroundImageService} from "@/api/admin/adminhomeimage";
import {VideoPlay, ArrowUp, Refresh, Loading, Bell, Close, Calendar} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import CategoryContent from '@/components/CategoryContent.vue'
import defaultBackground from '@/assets/background/background.webp'

// 添加 router 实例
const router = useRouter()

// 视频列表数据模型
const videos = ref([])

// 轮播图数据模型
const carouselItems = ref([])
// 轮播图加载状态
const loadingCarousel = ref(false)

// 分类导航
const categories = ref([
  { id: 0, name: '全部' },
  { id: 1, name: '动画' },
  { id: 2, name: '番剧' },
  { id: 3, name: '国创' },
  { id: 4, name: '音乐' },
  { id: 5, name: '舞蹈' },
  { id: 6, name: '游戏' },
  { id: 7, name: '知识' },
  { id: 8, name: '科技' },
  { id: 9, name: '运动' },
  { id: 10, name: '生活' },
  { id: 11, name: '美食' },
  { id: 12, name: '动物' },
  { id: 13, name: '鬼畜' },
  { id: 14, name: '时尚' },
  { id: 15, name: '娱乐' }
])

// 当前激活的分类
const activeCategory = ref(0)

// 加载状态
const loading = ref(false)

// 公告数据
const announcements = ref([])
const loadingAnnouncements = ref(false)

// 添加播放视频相关状态
const videoPlayerVisible = ref(false)
const currentPlayingVideo = ref(null)

// 背景图
const backgroundImage = ref(defaultBackground)
const loadingBackground = ref(false)

// 活动数据
const activities = ref([])
const loadingActivities = ref(false)

// 分类点击处理
const handleCategoryClick = async (categoryId) => {
  activeCategory.value = categoryId
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 通过分类ID获取对应视频
  loading.value = true
  try {
    // 如果选择的是"全部"分类，则不传递分类ID参数
    const res = categoryId === 0 
      ? await getVideoListService() 
      : await getVideoListService({ categoryId })
    videos.value = res.data
  } catch (error) {
    console.error('获取分类视频失败:', error)
    ElMessage.error('获取分类视频失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 更新轮播图高度的函数
const updateCarouselHeight = () => {
  // 在新布局中，轮播图高度固定
  carouselHeight.value = '480px'
}

// 轮播图高度
const carouselHeight = ref('480px')

// 视频分组，前6个显示在主区域，其余的显示在底部
const topVideos = computed(() => {
  return videos.value.slice(0, 6);
});

const bottomVideos = computed(() => {
  return videos.value.slice(6);
});

//调用获取视频列表数据接口
const getVideoList = async () => {
  loading.value = true
  try {
    // 根据当前选中的分类获取视频
    const res = activeCategory.value === 0
      ? await getVideoListService()
      : await getVideoListService({ categoryId: activeCategory.value })
  videos.value = res.data
  } catch (error) {
    console.error('获取视频列表失败:', error)
    ElMessage.error('获取视频列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 添加刷新方法
const handleRefresh = async () => {
  try {
    loading.value = true
    // 重新获取当前分类的视频
    const res = activeCategory.value === 0
      ? await getVideoListService()
      : await getVideoListService({ categoryId: activeCategory.value })
    videos.value = res.data
    ElMessage.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取公告列表
const getAnnouncementList = async () => {
  loadingAnnouncements.value = true
  try {
    const res = await getAnnouncementListService()
    if (res.code === 200 && res.data) {
      announcements.value = res.data
    } else {
      console.error('获取公告列表失败:', res.message)
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loadingAnnouncements.value = false
  }
}


// 获取轮播图数据
const getCarouselData = async () => {
  loadingCarousel.value = true
  try {
    const result = await getHomeImageService()
    if (result.code === 200 && result.data) {
      // 将API返回的数据转换为轮播图需要的格式
      carouselItems.value = result.data.map(item => ({
        id: item.homeImgId,
        title: item.title,
        description: item.description || '暂无描述',
        image: item.image,
        video: item.video,
        link: `/video/${item.homeImgId}`
      }))
    } else {
      console.error('获取轮播图数据失败:', result.message)
      // 如果API请求失败，也不在页面显示错误信息，保持良好的用户体验
    }
  } catch (error) {
    console.error('获取轮播图数据失败:', error)
  } finally {
    loadingCarousel.value = false
  }
}

// 获取背景图数据
const getBackgroundData = async () => {
  loadingBackground.value = true
  try {
    const result = await getBackgroundImageService()
    if (result.code === 200 && result.data && result.data.img) {
      backgroundImage.value = result.data.img
    }
  } catch (error) {
    console.error('获取背景图数据失败:', error)
  } finally {
    loadingBackground.value = false
  }
}


// 显示活动详情
const showActivityDetails = (activity) => {
  router.push('/activity')
}

onMounted(() => {
  getVideoList()
  getAnnouncementList()
  getCarouselData() // 获取轮播图数据
  getBackgroundData() // 获取背景图数据
})

// 添加视频点击处函数
const handleVideoClick = (video) => {
  router.push({
    path: `/video/${video.id}`,
    // 可选:通过 query 传递一些基础数据,减少详情页的首次加载等待
    query: {
      title: video.title,
      cover: video.cover
    }
  })
}

// 监听滚动位置，控制轮播图的行为
const isScrolledToBottom = ref(false)
const handleScroll = () => {
  // 计算滚动位置
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
  )

  // 检查是否滚动到了底部区域附近（距离底部300px）
  isScrolledToBottom.value = scrollTop + windowHeight > documentHeight - 300
}

// 监听窗口大小变化和滚动事件
onMounted(() => {
  updateCarouselHeight()
  window.addEventListener('resize', updateCarouselHeight)
  window.addEventListener('scroll', handleScroll)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', updateCarouselHeight)
  window.removeEventListener('scroll', handleScroll)
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
})

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  const category = categories.value.find(c => c.id == categoryId)
  return category ? category.name : ''
}

// 处理播放视频点击
const handlePlayVideo = (item) => {
  currentPlayingVideo.value = item
  videoPlayerVisible.value = true
  
  // 添加键盘事件监听，按ESC键关闭视频播放器
  document.addEventListener('keydown', handleKeyDown)
}

// 关闭视频播放器
const closeVideoPlayer = () => {
  videoPlayerVisible.value = false
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
  
  // 延迟重置当前播放视频，避免关闭动画过程中视频内容突然消失
  setTimeout(() => {
    currentPlayingVideo.value = null
  }, 300)
}

// 处理键盘按下事件
const handleKeyDown = (event) => {
  // 如果按下ESC键，关闭视频播放器
  if (event.key === 'Escape') {
    closeVideoPlayer()
  }
}

// 视频加载完成处理
const videoLoaded = (event) => {
  const video = event.target
  // 添加加载完成样式类
  video.classList.add('video-loaded')
}
</script>

<template>
  <div class="home">
    <!-- 顶部背景图 -->
    <div class="top-background">
      <img :src="backgroundImage" alt="顶部背景图" class="background-image">
    </div>

    <!-- 新的主要内容区域，左边轮播图，右边视频 -->
    <div class="main-layout" :class="{ 'full-width': activeCategory !== 0 }">
      <!-- 全部分类的内容 -->
      <template v-if="activeCategory === 0">
        <!-- 左侧轮播图区域 -->
        <div class="left-carousel">
          <div v-if="loadingCarousel" class="carousel-loading">
            <el-skeleton animated :rows="0" style="width: 100%; height: 100%;">
              <template #template>
                <div style="height: 480px; width: 100%; background: #f3f3f3; border-radius: 8px"></div>
              </template>
            </el-skeleton>
          </div>
          <el-carousel
            v-else
            :height="carouselHeight"
            class="carousel-container main-carousel"
            :interval="4000"
            :indicator-position="'none'"
          >
            <el-carousel-item v-for="item in carouselItems" :key="item.id" class="carousel-item">
              <div class="carousel-content">
                <img :src="item.image" :alt="item.title" class="carousel-image">
                <div class="carousel-overlay">
                  <h3 class="carousel-title">{{ item.title }}</h3>
                  <p class="carousel-description">{{ item.description }}</p>
                  <div class="carousel-info">
                    <span class="play-icon" @click.stop="handlePlayVideo(item)">
                      <el-icon><VideoPlay/></el-icon>
                      立即观看
                    </span>
                  </div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 右侧视频区域 -->
        <div class="right-videos">
          <!-- 加载状态 -->
          <div class="loading-container" v-if="loading">
            <el-skeleton :rows="6" animated />
        </div>

        <!-- 视频列表 -->
          <div class="video-grid" v-else>
            <div v-for="(video, index) in topVideos" :key="index" class="video-card" @click="handleVideoClick(video)">
            <div class="video-thumbnail">
              <img :src="video.cover" :alt="video.title" class="cover-image">
            </div>
              <div class="video-title">
                {{ video.title }}
              </div>
            <div class="video-info">
                <div class="uploader">
                  <span class="up-tag"><img src="../assets/iconsvg/up.svg" style="width: 20px" alt=""></span>
                  <img :src="video.userPic || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
                       class="user-avatar">
                  <span class="username">{{ video.nickname }}</span>
                </div>
                <span class="category-tag" v-if="getCategoryName(video.categoryId)">
                  {{ getCategoryName(video.categoryId) }}
              </span>
            </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 分类内容 -->
      <CategoryContent
          v-else
          :category-id="activeCategory"
          :category-name="getCategoryName(activeCategory)"
          :videos="videos"
          @video-click="handleVideoClick"
      />
    </div>

    <!-- 底部额外内容区域 -->
    <div class="bottom-section" v-if="bottomVideos.length > 0 && !loading && activeCategory === 0">
      <div class="section-title">
        <h2>更多推荐</h2>
      </div>
      <div class="bottom-video-grid">
        <div v-for="(video, index) in bottomVideos" :key="index" class="video-card" @click="handleVideoClick(video)">
          <div class="video-thumbnail">
            <img :src="video.cover" :alt="video.title" class="cover-image">
          </div>
          <div class="video-title">
            {{ video.title }}
          </div>
          <div class="video-info">
            <div class="uploader">
              <span class="up-tag"><img src="../assets/iconsvg/up.svg" style="width: 20px" alt=""></span>
              <img :src="video.userPic || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
                   class="user-avatar">
              <span class="username">{{ video.nickname }} </span>
            </div>
            <span class="category-tag" v-if="getCategoryName(video.categoryId)">
              {{ getCategoryName(video.categoryId) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改固定按钮组 -->
    <div class="fixed-buttons">
      <!-- 刷新按钮 -->
      <div class="action-button refresh-btn" @click="handleRefresh">
        <el-icon v-if="!loading">
          <Refresh/>
        </el-icon>
        <el-icon v-else class="is-loading">
          <Loading/>
        </el-icon>
      </div>

      <!-- 返回顶部按钮 -->
      <el-backtop
        :right="40"
        :bottom="100"
        :visibility-height="400"
        class="back-to-top"
      >
        <div class="back-top-content">
          <el-icon>
            <ArrowUp/>
          </el-icon>
        </div>
      </el-backtop>
    </div>

    <!-- 添加视频播放器弹窗 -->
    <div class="video-player-overlay" v-if="videoPlayerVisible" @click="closeVideoPlayer">
      <div class="video-player-container" @click.stop>
        <div class="video-player-header">
          <div class="close-btn" @click="closeVideoPlayer">
            <el-icon><Close /></el-icon>
          </div>
        </div>
        <video 
          v-if="currentPlayingVideo"
          class="video-player"
          :src="currentPlayingVideo.video"
          controls
          autoplay
          @loadedmetadata="videoLoaded"
        ></video>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: 20px;
  width: 100%;
  min-height: 100vh;
  padding-top: 0;
  margin: 0 auto;
  position: relative;
  max-width: 100%;
  background-color: #f4f5f7;
}

/* 顶部背景图样式 */
.top-background {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  z-index: 0;
  margin-bottom: 10px;
  margin-top: -64px; /* 负外边距，使背景图位于导航栏下方 */
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 添加顶部背景图蒙版效果 */
.top-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.4) 0%,
      rgba(0, 0, 0, 0.2) 20%,
      rgba(0, 0, 0, 0) 40%,
      rgba(244, 245, 247, 0) 60%,
      rgba(244, 245, 247, 0.8) 95%,
      rgba(244, 245, 247, 1) 100%
  ),
  linear-gradient(
      to right,
      rgba(244, 245, 247, 0.5) 0%,
      rgba(244, 245, 247, 0) 10%,
      rgba(244, 245, 247, 0) 90%,
      rgba(244, 245, 247, 0.5) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* 分类导航样式 */
.category-nav {
  display: flex;
  justify-content: space-around;
  padding: 12px 40px;
  margin-bottom: 0;
  margin-top: 0;
  overflow-x: auto;
  white-space: nowrap;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  position: relative;
  z-index: 2; /* 确保在背景图上方 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

/* 隐藏滚动条 Chrome, Safari */
.category-nav::-webkit-scrollbar {
  display: none;
}

.category-item {
  padding: 6px 20px;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
  position: relative;
  box-sizing: border-box;
}

.category-item:hover {
  color: #fb7299;
  transform: scale(1.05);
}

/* 修改激活状态样式，确保不会导致内容溢出 */
.category-item.active {
  color: #fb7299;
  font-weight: bold;
  position: relative;
}

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background-color: #fb7299;
  border-radius: 2px;
  /* 确保伪元素不会造成内容溢出 */
  box-sizing: content-box;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; width: 0; }
  to { opacity: 1; width: 24px; }
}

/* 添加分类标签样式 */
.category-tag {
  background-color: #fb729930;
  color: #fb7299;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: auto;
  white-space: nowrap;
}

/* 新的主布局样式 */
.main-layout {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding: 0 40px;
  max-width: calc(100% - 80px);
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2; /* 确保在背景图上方 */
}

.left-carousel {
  width: 40%;
  min-width: 300px;
  max-width: 480px;
}

.right-videos {
  width: 60%;
  flex-grow: 1;
}

/* 轮播图样式 */
.carousel-container {
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel-item {
  overflow: hidden;
  border-radius: 4px;
}

.carousel-content {
  position: relative;
  height: 100%;
  transition: transform 0.3s ease;
  overflow: hidden;
  border-radius: 4px;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(
    transparent 0%,
      rgba(0, 0, 0, 0.6) 50%,
      rgba(0, 0, 0, 0.8) 100%
  );
  color: #fff;
}

.carousel-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.carousel-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 10px 0;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carousel-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.play-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fb7299;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-icon:hover {
  background-color: #fc8bab;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.4);
}

/* 视频网格样式 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 12px;
  width: 100%;
}

.video-card {
  overflow: hidden;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  min-width: 0;
  margin-bottom: 0;
  background-color: #fff;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  background-color: #f5f5f5;
  margin-bottom: 0;
  overflow: hidden;
  border-radius: 6px 6px 0 0;
}

.video-title {
  margin: 0;
  padding: 8px 10px;
  -webkit-line-clamp: 1;
  line-height: 1.3;
  font-weight: normal;
  height: auto;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  background-color: #f8f8f9;
}

.video-info {
  font-size: 12px;
  color: #999;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  text-align: left;
  margin-top: 0;
}

.uploader {
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 5px;
}

.up-tag {
  color: #fb7299;
  font-weight: bold;
  font-size: 12px;
  margin-right: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover .cover-image {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 0 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  border-radius: 2px;
  line-height: 1.5;
}

.video-views {
  position: absolute;
  bottom: 8px;
  left: 8px;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 添加固定按钮组样式 */
.fixed-buttons {
  position: fixed;
  right: 40px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
    gap: 16px;
  z-index: 999;
}

/* 通用按钮样式 */
.action-button {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: #fb7299;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  background-color: #fc8bab;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 114, 153, 0.3);
}

.action-button .el-icon {
  font-size: 20px;
}

.action-button .el-icon.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 返回顶部按钮样式 */
.back-to-top {
  --el-backtop-bg-color: #fb7299;
  --el-backtop-text-color: #fff;
  --el-backtop-hover-bg-color: #fc8bab;
}

.back-top-content {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-top-content .el-icon {
  font-size: 20px;
}

:deep(.el-backtop) {
  background-color: var(--el-backtop-bg-color);
  color: var(--el-backtop-text-color);
  height: 44px;
  width: 44px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: static;
  transform: none;
}

:deep(.el-backtop:hover) {
  background-color: var(--el-backtop-hover-bg-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 114, 153, 0.3);
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .main-layout {
    flex-direction: column;
    padding: 0 20px;
  }

  .main-layout.full-width {
    padding: 0 20px;
  }

  .left-carousel,
  .right-videos {
    width: 100%;
    min-width: auto;
  }

  /* 当页面变窄时调整轮播图尺寸 */
  .left-carousel {
    max-width: 100%;
  }

  .carousel-container {
    width: 100%;
    max-height: 450px;
  }

  /* 即使在小屏幕上也保持3×2布局 */
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 768px) {
  /* 中等屏幕仍保持3×2布局 */
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  /* 调整轮播图高度 */
  .carousel-container {
    max-height: 400px;
  }

  .fixed-buttons {
    right: 20px;
    bottom: 20px;
    gap: 12px;
  }

  .action-button,
  :deep(.el-backtop) {
    width: 40px;
    height: 40px;
  }

  .carousel-title {
    font-size: 20px;
}

.carousel-description {
    -webkit-line-clamp: 1;
  }
}

@media screen and (max-width: 576px) {
  /* 在最小屏幕上改为2×3布局 */
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, auto);
  }

  /* 调整轮播图高度适应小屏幕 */
  .carousel-container {
    max-height: 350px;
  }

  .carousel-title {
    font-size: 18px;
  }

  .category-nav {
    padding: 0 10px;
  }

  .category-item {
    padding: 8px 12px;
    font-size: 14px;
  }
}

/* 视频缩略图样式优化 */
.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
  font-size: 12px;
}

/* 底部内容区域样式 */
.bottom-section {
  margin-top: 40px;
  padding: 0 40px;
  max-width: calc(100% - 80px);
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 40px;
}

.section-title {
  margin-bottom: 20px;
  border-left: 4px solid #fb7299;
  padding-left: 12px;
}

.section-title h2 {
  font-size: 20px;
  font-weight: bold;
  color: #18191c;
  margin: 0;
}

.bottom-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  width: 100%;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .bottom-video-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .bottom-video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .bottom-video-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-section {
    padding: 0 20px;
  }
}

@media screen and (max-width: 576px) {
  .bottom-video-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* 大屏幕适配 */
@media screen and (min-width: 1600px) {
  .main-layout, .bottom-section {
    max-width: 1500px;
  }

  /* 大屏幕上也保持3×2布局 */
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bottom-video-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.loading-container {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
}

/* 添加新的样式 */
.main-layout.full-width {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media screen and (max-width: 1200px) {
  .main-layout.full-width {
    max-width: 100%;
  }
}

/* 公告栏样式 */
.notice-bar {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 12px 40px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.notice-icon {
  color: #fb7299;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  width: 36px;
  height: 36px;
  background-color: rgba(251, 114, 153, 0.1);
  border-radius: 50%;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 36px;
}

.notice-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 10px;
}

.notice-text {
  font-size: 15px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
  line-height: 36px;
  font-weight: 500;
  flex: 1;
}

.notice-detail-btn {
  font-size: 12px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  flex-shrink: 0;
}

.empty-notice {
  font-size: 14px;
  color: #999;
  line-height: 36px;
  text-align: center;
}

/* 公告栏轮播样式 - 使用非常具体的选择器 */
.notice-content .el-carousel {
  height: 36px;
}

.notice-content :deep(.el-carousel__container) {
  height: 36px !important;
}

.notice-content :deep(.el-carousel__item) {
  line-height: 36px;
  padding: 0;
}

/* 主轮播图样式 - 使用非常具体的选择器 */
.main-carousel {
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-carousel :deep(.el-carousel__container) {
  height: 480px !important;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .main-carousel :deep(.el-carousel__container) {
    height: 400px !important;
  }
}

@media screen and (max-width: 768px) {
  .main-carousel :deep(.el-carousel__container) {
    height: 350px !important;
  }
}

@media screen and (max-width: 576px) {
  .main-carousel :deep(.el-carousel__container) {
    height: 250px !important;
  }
}

/* 添加视频播放器弹窗样式 */
.video-player-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.video-player-container {
  background-color: #000;
  border-radius: 8px;
  width: 80%;
  max-width: 1200px;
  aspect-ratio: 16/9;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.video-player-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  z-index: 1;
  transition: opacity 0.3s ease;
  opacity: 1;
}

.video-player-container:hover .video-player-header {
  opacity: 1;
}

.video-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

.video-loaded {
  opacity: 1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 添加轮播图加载状态样式 */
.carousel-loading {
  width: 100%;
  height: 480px;
  border-radius: 8px;
  overflow: hidden;
}

/* 活动栏样式 */
.activity-bar {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 12px 40px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.activity-icon {
  color: #ff5722;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  width: 36px;
  height: 36px;
  background-color: rgba(255, 87, 34, 0.1);
  border-radius: 50%;
}

.activity-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 36px;
}

.activity-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 10px;
}

.activity-text {
  font-size: 15px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
  line-height: 36px;
  font-weight: 500;
  flex: 1;
}

.activity-label {
  display: inline-block;
  background-color: #ff5722;
  color: white;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
  margin-right: 10px;
  line-height: normal;
}

.activity-detail-btn {
  font-size: 12px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  flex-shrink: 0;
}

/* 活动栏轮播样式 - 使用非常具体的选择器 */
.activity-content .el-carousel {
  height: 36px;
}

.activity-content :deep(.el-carousel__container) {
  height: 36px !important;
}

.activity-content :deep(.el-carousel__item) {
  line-height: 36px;
  padding: 0;
}
</style>