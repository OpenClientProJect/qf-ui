<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {getVideoListService} from "@/api/video";
import { VideoPlay, CaretTop, ArrowUp, Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 添加 router 实例
const router = useRouter()

// 视频列表数据模型
const videos = ref([])

// 轮播图数据模型
const carouselItems = ref([
  {
    id: 1,
    title: '我推的孩子',
    description: '16岁的天才少女星野爱久爱海梦想成为偶像，但在甄选会上却屡屡受挫...',
    image: 'https://play.xfvod.pro/images/hb/wtdhz.png',
    link: '/video/1'
  },
  {
    id: 2,
    title: '败犬女主太多了',
    description: '这是一段视频介绍文字，简单描述视频的主要内容...',
    image: 'https://play.xfvod.pro/images/hb/baiquan.jpg',
    link: '/video/2'
  },
  {
    id: 3,
    title: '青之箱',
    description: '这是另一段视频介绍文字，帮助用户了解视频内容...',
    image: 'https://play.xfvod.pro/images/hb/lx.jpg',
    link: '/video/3'
  },
  {
    id: 4,
    title: '缘结甘神家',
    description: '这是另一段视频介绍文字，帮助用户了解视频内容...',
    image: 'https://picgg.cycimg.me/banner/GXehBtTbYAALPbN-up2x.webp',
    link: '/video/4'
  }
])

// 轮播图相关状态
const currentIndex = ref(0)
const carouselRef = ref(null)
const progress = ref(0)
let progressTimer = null
let autoplayTimer = null

// 计算轮播图高度
const bannerHeight = ref('480px')

// 更新轮播图高度的函数
const updateBannerHeight = () => {
  const width = window.innerWidth
  // 根据屏幕宽度计算合适的高度，保持16:9的比例
  const height = Math.floor((width * 9) / 16)
  // 设置最小和最大高度限制
  const finalHeight = Math.max(400, Math.min(height, 720))
  bannerHeight.value = `${finalHeight}px`
}

//调用获取视频列表数据接口
const getVideoList = async () => {
  const res = await getVideoListService()
  videos.value = res.data
}
getVideoList()

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

// 添加刷新方法
const handleRefresh = () => {
  window.location.reload()
}

// 处理轮播图切换
const handleSlideChange = (index) => {
  currentIndex.value = index
  resetProgress()
}

// 处理缩略图悬停
const handleThumbnailHover = (index) => {
  currentIndex.value = index
  carouselRef.value?.setActiveItem(index)
  resetProgress()
}

// 重置并开始进度条
const resetProgress = () => {
  progress.value = 0
  clearInterval(progressTimer)
  clearInterval(autoplayTimer)

  progressTimer = setInterval(() => {
    progress.value += 2  // 每100ms增加2%，总共5000ms
    if (progress.value >= 100) {
      progress.value = 0
      goToNextSlide()
    }
  }, 100)
}

// 切换到下一张图片
const goToNextSlide = () => {
  const nextIndex = (currentIndex.value + 1) % carouselItems.value.length
  handleThumbnailHover(nextIndex)
}

// 开始自动播放
const startAutoplay = () => {
  autoplayTimer = setInterval(() => {
    goToNextSlide()
  }, 5000)
}

// 监听窗口大小变化
onMounted(() => {
  // 初始化轮播图
  updateBannerHeight()
  window.addEventListener('resize', updateBannerHeight)
  
  // 启动自动播放和进度条
  startAutoplay()
  resetProgress()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', updateBannerHeight)
  
  // 清除定时器
  clearInterval(progressTimer)
  clearInterval(autoplayTimer)
})
</script>

<template>
  <div class="home">
    <!-- 轮播图区域 -->
    <div class="banner-section">
      <el-carousel
        :interval="5000"
        arrow="never"
        :height="bannerHeight"
        trigger="click"
        @change="handleSlideChange"
        :autoplay="false"
        ref="carouselRef"
      >
        <el-carousel-item v-for="(item, index) in carouselItems" :key="item.id">
          <div class="banner-content">
            <img :src="item.image" :alt="item.title" class="banner-image">
          </div>
        </el-carousel-item>
      </el-carousel>

      <!-- 底部缩略图 -->
      <div class="thumbnail-list">
        <div
          v-for="(item, index) in carouselItems"
          :key="item.id"
          class="thumbnail-item"
          :class="{ 'active': currentIndex === index }"
          @mouseenter="handleThumbnailHover(index)"
        >
          <img :src="item.image" :alt="item.title">
          <div class="thumbnail-title">{{ item.title }}</div>
          <div
            v-if="currentIndex === index"
            class="progress-bar"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 主要内容区域 -->
      <div class="content-section">
        <div class="section-title">
          <el-icon><VideoPlay /></el-icon>
          热门推荐
        </div>
        <!-- 视频列表 -->
        <div class="video-grid">
          <el-card v-for="video in videos" :key="video.id" class="video-card" @click="handleVideoClick(video)">
            <div class="video-thumbnail">
              <img :src="video.cover" :alt="video.title" class="cover-image">
            </div>
            <div class="video-title">{{ video.title }}</div>
            <div class="video-info">
              <span class="uploader">
                <span class="up-tag">UP：</span>
                <el-avatar :size="24" :src="video.userPic" />
                {{ video.nickname }}
              </span>
              <span class="play-count">播放: 10000 万</span>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 修改固定按钮组 -->
    <div class="fixed-buttons">
      <!-- 刷新按钮 -->
      <div class="action-button refresh-btn" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
      </div>

      <!-- 返回顶部按钮 -->
      <el-backtop
          :right="40"
          :bottom="100"
          :visibility-height="400"
          class="back-to-top"
      >
        <div class="back-top-content">
          <el-icon><ArrowUp /></el-icon>
        </div>
      </el-backtop>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: 20px;
  width: 100%;
  min-height: 100vh;
  padding-top: 0;
}

/* 轮播图区域样式 */
.banner-section {
  width: 100%;
  position: relative;
  margin-top: -64px;
  overflow: visible;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.banner-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 修改底部渐变遮罩 */
.banner-content::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 300px; /* 增加渐变高度 */
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(245, 247, 250, 0.2) 40%,
    rgba(245, 247, 250, 0.6) 70%,
    rgba(245, 247, 250, 0.98) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* 底部缩略图样式 */
.thumbnail-list {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: min(-100px, -10%); /* 增加上移距离 */
  padding: 0 20px;
  position: relative;
  z-index: 2;
  padding-top: 64px; /* 添加顶部内边距，为导航栏留出空间 */
}

.thumbnail-item {
  width: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transform-origin: center bottom;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-top-width: 0;
  backdrop-filter: blur(4px);
}

.thumbnail-item img {
  width: 100%;
  height: 112px;
  object-fit: cover;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.thumbnail-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3),
      transparent
  );
  z-index: 2;
}

.progress-bar {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  height: 4px;
  background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.95),
      rgba(255, 255, 255, 0.8)
  );
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: width 0.1s ease-out;
  z-index: 3;
}

.thumbnail-item.active {
  transform: translateY(-10px) scale(1.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 2;
  border-color: #fff;
  border-top-width: 0;
}

.thumbnail-item.active::before {
  background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.4),
      transparent
  );
}

.thumbnail-item.active .progress-bar {
  height: 8px;
  background: linear-gradient(
      to right,
      rgba(255, 255, 255, 1),
      rgba(255, 255, 255, 0.9)
  );
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.thumbnail-item.active .thumbnail-title {
  font-weight: 500;
}

.thumbnail-item:not(.active) {
  filter: brightness(0.8);
  transform: scale(0.95);
  border-color: rgba(255, 255, 255, 0.6);
  border-top-width: 0;
}

.thumbnail-item:not(.active)::before {
  opacity: 0.8;
}

.thumbnail-item:not(.active) .progress-bar {
  opacity: 0.9;
  background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.8),
      rgba(255, 255, 255, 0.6)
  );
}

.thumbnail-item:hover:not(.active) {
  border-color: rgba(255, 255, 255, 0.9);
  border-top-width: 0;
}

.thumbnail-item:hover:not(.active)::before {
  opacity: 0.9;
}

.thumbnail-item:hover:not(.active) .progress-bar {
  opacity: 1;
  background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.7)
  );
}

.thumbnail-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(
      to bottom,
      transparent,
      rgba(0, 0, 0, 0.5) 30%,
      rgba(0, 0, 0, 0.8)
  );
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  z-index: 2;
}

.content-section {
  margin-top: 0;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 40px;
  box-sizing: border-box;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #18191c;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-grid {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 2400px;
  margin: 0 auto;
}

.video-card {
  margin-bottom: 15px;
  overflow: hidden;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  text-align: center;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  aspect-ratio: 16 / 9;
  background-color: #f5f5f5;
  margin-bottom: 8px;
  overflow: hidden;
  border-radius: 4px;
  width: 100%;
}

:deep(.el-card__body) {
  padding: 8px;
}

:deep(.el-card) {
  border-radius: 6px;
  overflow: hidden;
}

.video-title {
  font-size: 15px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  font-weight: 500;
  text-align: left;
}

.video-info {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  text-align: left;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  border-radius: 4px;
}

.video-thumbnail:hover .cover-image {
  transform: scale(1.05);
}

.uploader {
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.up-tag {
  color: #fb7299;
  font-weight: bold;
  font-size: 13px;
}

.play-count {
  color: #999;
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

.main-content {
  position: relative;
  z-index: 2;
  margin-top: 20px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 40px 0 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .thumbnail-item {
    width: 180px;
  }

  .thumbnail-item img {
    height: 100px;
  }
  
  .content-section {
    padding: 0 30px;
  }
}

@media screen and (max-width: 2000px) {
  .video-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media screen and (max-width: 1600px) {
  .video-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media screen and (max-width: 1400px) {
  .video-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media screen and (max-width: 900px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .thumbnail-item {
    width: 80px;
  }
  
  .thumbnail-item img {
    height: 45px;
  }
  
  .thumbnail-title {
    font-size: 12px;
    padding: 4px;
    -webkit-line-clamp: 1;
  }
  
  .banner-section {
    margin-top: -56px;
  }

  .banner-content::after {
    height: 150px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(245, 247, 250, 0.4) 50%,
      rgba(245, 247, 250, 0.9) 100%
    );
  }

  .thumbnail-list {
    margin-top: -50px;
    padding: 0 12px;
    gap: 8px;
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
}

@media screen and (max-width: 600px) {
  .video-grid {
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
  }

  .content-section {
    padding: 0 12px;
  }
}
</style>