<template>
  <div class="anime">
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
        <el-carousel-item v-for="(item, index) in bannerList" :key="index" @click="goToAnimePlayer(item.id)">
          <div class="banner-content">
            <img :src="item.coverImage" :alt="item.title" class="banner-image">
          </div>
        </el-carousel-item>
      </el-carousel>

      <!-- 底部缩略图 -->
      <div class="thumbnail-list">
        <div
            v-for="(item, index) in bannerList"
            :key="index"
            class="thumbnail-item"
            :class="{ 'active': currentIndex === index }"
            @mouseenter="handleThumbnailHover(index)"
            @click="goToAnimePlayer(item.id)"
        >
          <img :src="item.coverImage" :alt="item.title">
          <div class="thumbnail-title">{{ item.title }}</div>
          <div
              v-if="currentIndex === index"
              class="progress-bar"
              :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 番剧热播榜 -->
    <div class="hot-anime-section">
      <div class="section-header">
        <div class="title">
          <img class="title-icon" src="../assets/imge/huohua.png" alt="hot">
          番剧热播榜
        </div>
      </div>

      <div class="hot-anime-list">
        <div v-for="(anime, index) in hotAnimeList"
             :key="anime.animeId"
             class="hot-anime-item"
             @click="goToAnimePlayer(anime.animeId)"
        >
          <div class="anime-cover">
            <img :src="anime.coverImage" :alt="anime.title">
            <div class="score">{{ getStatusLabel(anime.status) }}</div>
          </div>
          <div class="anime-info">
            <div class="rank-number">{{ index + 1 }}</div>
            <div class="info-content">
              <div class="title">{{ anime.title }}</div>
              <div class="desc">{{ anime.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onUnmounted, onMounted, computed} from 'vue'
import {getBangumiService, getHotService} from "@/api/bangumi/bangumi"
import {getAnimeListService, getBannerService} from "@/api/anime/anime"
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('recommended')
const currentIndex = ref(0)
const carouselRef = ref(null)
const progress = ref(0)
let progressTimer = null
let autoplayTimer = null

// 轮播图数据
const bannerList = ref([
  {
    coverImage: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg',
    title: '新番时间表',
    id: 1
  },
  {
    coverImage: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg',
    title: '番剧热播榜',
    id: 2
  }
])
// 热播榜数据
const hotAnimeList = ref([])
// 分页参数
const pageParams = ref({
  pageNum: 1,
  pageSize: 10
})

// 计算轮播图高度
const bannerHeight = ref('520px')

// 更新轮播图高度
const updateBannerHeight = () => {
  const width = window.innerWidth
  // 根据屏幕宽度计算合适的高度，保持16:9的比例
  const height = Math.floor((width * 9) / 16)
  // 设置最小和最大高度限制
  const finalHeight = Math.max(400, Math.min(height, 720))
  bannerHeight.value = `${finalHeight}px`
}

// 监听窗口大小变化
const handleResize = () => {
  updateBannerHeight()
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
  const nextIndex = (currentIndex.value + 1) % bannerList.value.length
  handleThumbnailHover(nextIndex)
}

// 开始自动播放
const startAutoplay = () => {
  autoplayTimer = setInterval(() => {
    goToNextSlide()
  }, 5000)
}

// 组件挂载时启动自动播放
onMounted(() => {
  startAutoplay()
  resetProgress()
  updateBannerHeight()
  window.addEventListener('resize', handleResize)
})

// 组件卸载清理定时器
onUnmounted(() => {
  clearInterval(progressTimer)
  clearInterval(autoplayTimer)
  window.removeEventListener('resize', handleResize)
})
//获取轮播图内容
const getBannerList = async () => {
  const res = await getBannerService()
  bannerList.value = res.data
}
getBannerList()


// 获取番剧列表数据
const getHotAnimeList = async () => {
  try {
    const res = await getAnimeListService(pageParams.value)
    // 直接使用返回的数据
    hotAnimeList.value = res.data.items;
    
    // 更新轮播图数据，使用热门番剧的前4条数据
    if (hotAnimeList.value && hotAnimeList.value.length > 0) {
      const topAnimes = hotAnimeList.value.slice(0, 4); // 获取前4条数据
      bannerList.value = topAnimes.map(anime => ({
        id: anime.animeId,
        title: anime.title,
        coverImage: anime.coverImage,
        description: anime.description
      }));
    }
  } catch (error) {
    console.error('获取番剧列表失败:', error)
  }
}
getHotAnimeList()


const currentDay = ref(1) // 默认显示周一
const allScheduleList = ref([])

// 计算当前显示的列表
const scheduleList = computed(() => {
  // 获取当前选中日期的数据
  const currentDayData = allScheduleList.value?.[currentDay.value - 1] || {}
  const items = currentDayData.items || []

  return items.map(item => ({
    ...item,
    // 格式化时间
    air_time: item.air_date?.split(' ')[1] || '',
    // 格式化评分
    score: item.rating?.score ? Number(item.rating.score).toFixed(1) : null,
    // 使用中文名优先
    title: item.name_cn || item.name || '',
    // 图片地址
    images: item.images?.large || ''
  }))
})

// 获取新番时间表数据
const getScheduleList = async () => {
  try {
    const res = await getBangumiService()
    if (res && Array.isArray(res.data)) {
      allScheduleList.value = res.data
    }
  } catch (error) {
    console.error('获取新番时间表失败:', error)
    allScheduleList.value = []
  }
}

onMounted(() => {
  getScheduleList()
})

// 拖动相关状态
const scrollWrapper = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const lastX = ref(0)

// 开始拖动
const startDrag = (e) => {
  isDragging.value = true
  startX.value = e.pageX
  lastX.value = e.pageX
  scrollLeft.value = scrollWrapper.value.scrollLeft
}

// 拖动中
const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()

  const deltaX = e.pageX - lastX.value
  scrollWrapper.value.scrollLeft -= deltaX
  lastX.value = e.pageX
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
}

// 格式化状态文字
const getStatusLabel = (status) => {
  const labels = {
    'ongoing': '连载中',
    'completed': '已完结',
    'upcoming': '即将上映',
    'hiatus': '暂停'
  }
  return labels[status] || '未知'
}

// 跳转到番剧播放页
const goToAnimePlayer = (animeId) => {
  if (!animeId) return
  router.push({
    path: `/anime/player/${animeId}`
  })
}
</script>

<style scoped>

/* 添加根容器样式控制 */
.anime {
  width: 100%;
  overflow-x: hidden; /* 防止横向滚动 */
  position: relative;
}

.anime-cover {
  height: 250px;
  background-color: #f5f5f5;
  margin-bottom: 8px;
}

.anime-title {
  font-size: 14px;
  margin-bottom: 8px;
}

.anime-info {
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}

/* 轮播图区域样式 */
.banner-section {
  width: 100%;
  position: relative;
  margin-top: -64px;
  overflow: visible;
}

.el-carousel {
  width: 100%;
  overflow: hidden;
  position: relative;
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

  &::before {
    background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.4),
        transparent
    );
  }

  .progress-bar {
    height: 8px;
    background: linear-gradient(
        to right,
        rgba(255, 255, 255, 1),
        rgba(255, 255, 255, 0.9)
    );
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .thumbnail-title {
    font-weight: 500;
  }
}

.thumbnail-item:not(.active) {
  filter: brightness(0.8);
  transform: scale(0.95);
  border-color: rgba(255, 255, 255, 0.6);
  border-top-width: 0;

  &::before {
    opacity: 0.8;
  }

  .progress-bar {
    opacity: 0.9;
    background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.8),
        rgba(255, 255, 255, 0.6)
    );
  }
}

.thumbnail-item:hover:not(.active) {
  border-color: rgba(255, 255, 255, 0.9);
  border-top-width: 0;

  &::before {
    opacity: 0.9;
  }

  .progress-bar {
    opacity: 1;
    background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.9),
        rgba(255, 255, 255, 0.7)
    );
  }
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

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .thumbnail-item {
    width: 180px;
  }

  .thumbnail-item img {
    height: 100px;
  }
}

@media screen and (max-width: 768px) {
  .thumbnail-item {
    width: 80px;

    img {
      height: 45px;
    }

    .thumbnail-title {
      font-size: 12px;
      padding: 4px;
      -webkit-line-clamp: 1;
    }
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

  .hot-anime-section,
  .schedule-section {
    padding: 16px 12px; /* 减小内边距 */
    width: 100%;
    box-sizing: border-box;
    overflow: hidden; /* 确保内容不会溢出 */
  }

  .section-header {
    margin-bottom: 16px;

    .title {
      font-size: 16px;

      .title-icon {
        width: 24px;
        height: 24px;
      }
    }

    .more {
      font-size: 12px;
    }
  }

  .hot-anime-list {
    margin: 0; /* 移除可能的外边距 */
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .hot-anime-item {
    .anime-cover {
      aspect-ratio: 3/4;
    }

    .anime-info {
      padding: 8px;
      gap: 8px;

      .rank-number {
        font-size: 20px;
        min-width: 24px;
      }

      .title {
        font-size: 14px;
        margin-bottom: 2px;
      }

      .desc {
        font-size: 12px;
        -webkit-line-clamp: 1;
      }
    }

    .score {
      font-size: 18px;
      bottom: 6px;
      right: 6px;
    }
  }

  .schedule-scroll-wrapper {
    margin: 0; /* 移除负边距 */
    padding: 16px 0; /* 只保留垂直内边距 */
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;

    /* 隐藏滚动条但保持功能 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Opera */
    }
  }

  .anime-schedule-list {
    padding-right: 12px; /* 添加右侧内边距，防止最后一个项目贴边 */
  }

  .schedule-item {
    width: 140px;
    height: 260px;

    .time {
      font-size: 12px;
      padding: 2px 10px;
      top: -8px;
    }

    .schedule-cover {
      height: 200px;
    }

    .schedule-info {
      padding: 8px;
      height: 50px;

      .title {
        font-size: 12px;
      }

      .episode {
        font-size: 11px;
        margin-top: 2px;
      }
    }

    .score {
      font-size: 18px;
    }
  }

  .weekday-tabs {
    margin: 0;
    padding: 0 0 8px 0;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    /* 隐藏滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .weekday-tab {
    padding: 4px 16px;
    font-size: 14px;
    min-width: 60px;
    flex-shrink: 0;

    &.active::after {
      bottom: -8px;
      width: 20px;
      height: 2px;
    }
  }
}

/* 修改全局滚动条样式 */
::-webkit-scrollbar {
  display: none;
}

/* 添加全局滚动条隐藏 */
html, body {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Opera */
  }
}

/* 修改动画列表容器样式 */
.anime-schedule-list {
  padding-right: 12px; /* 添加右侧内边距，防止最后一个项目贴边 */
}

/* 修改网格布局容器样式 */
.hot-anime-list {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 增加暗色模式支持 */
@media (prefers-color-scheme: dark) {
  @media screen and (max-width: 768px) {
    .banner-content::after {
      background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(18, 18, 18, 0.4) 50%,
          rgba(18, 18, 18, 0.9) 100%
      );
    }

    .hot-anime-item,
    .schedule-item {
      background: #1a1a1a;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .anime-info .title,
    .schedule-info .title {
      color: #e5e7eb;
    }

    .anime-info .desc,
    .schedule-info .episode {
      color: #666;
    }

    .weekday-tab {
      color: #999;

      &:hover:not(.active) {
        background: rgba(24, 144, 255, 0.15);
      }
    }
  }
}

/* 番剧热播榜样式 */
.hot-anime-section {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 20px 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header .title {
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.section-header .more {
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
  font-size: 14px;
}

.section-header .more:hover {
  color: #ff6b6b;
}

.hot-anime-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.hot-anime-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  width: 100%;
}

.rank-number {
  font-size: 28px;
  font-weight: 600;
  color: #ff6b6b;
  line-height: 1;
  z-index: 1;
  min-width: 32px;
  text-align: center;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.anime-cover {
  position: relative;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  aspect-ratio: 3/4;
  width: 100%;
}

.anime-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.score {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.anime-info {
  padding: 16px;
  background: #fff;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.anime-info .title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  margin-bottom: 4px;
}

.anime-info .desc {
  font-size: 14px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.hot-anime-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.hot-anime-item:hover img {
  transform: scale(1.05);
}

/* 前三名特殊样式 */
.hot-anime-item:nth-child(1) .rank-number {
  font-size: 28px;
  color: #ff6b6b;
}

.hot-anime-item:nth-child(2) .rank-number {
  color: #047edf;
}

.hot-anime-item:nth-child(3) .rank-number {
  color: #7c4dff;
}

/* 加图片遮罩 */
.anime-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
      to bottom,
      transparent,
      rgba(0, 0, 0, 0.4)
  );
  pointer-events: none;
}

.title-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  vertical-align: middle;
}

@media screen and (max-width: 1600px) {
  .hot-anime-section {
    padding: 20px;
  }
}

@media screen and (max-width: 768px) {
  .hot-anime-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

/* 新番时间表样式 */
.schedule-section {
  width: 100%;
  max-width: 1800px;
  margin: 30px auto 0;
  padding: 20px 40px;
}

.weekday-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 10px;
  padding-left: 10px;
}

.weekday-tab {
  padding: 6px 20px;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-radius: 20px;
  transition: all 0.3s ease;
  min-width: 80px;
  text-align: center;
  position: relative;
}

.weekday-tab.active {
  background: #1890ff;
  color: #fff;
  font-weight: 500;
}

.weekday-tab:hover:not(.active) {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.weekday-tab.active::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #1890ff;
  border-radius: 2px;
}

.schedule-content {
  position: relative;
}

.schedule-scroll-wrapper {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 10px 0;
  cursor: grab;
  user-select: none;
}

.schedule-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.schedule-scroll-wrapper:active {
  cursor: grabbing;
}

.schedule-scroll-wrapper * {
  user-select: none;
  -webkit-user-drag: none;
}

.anime-schedule-list {
  display: flex;
  gap: 20px;
  position: relative;
  padding-top: 20px;
  will-change: transform;
}

.anime-schedule-list::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 2px;
  background: #f0f0f0;
  z-index: 1;
}

.schedule-item {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  height: 340px; /* 固定高度 */
}

.time {
  font-size: 16px;
  color: #666;
  text-align: center;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.schedule-cover {
  width: 100%;
  height: 280px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.schedule-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.schedule-item:hover img {
  transform: scale(1.05);
}

.schedule-cover .score {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.schedule-info {
  padding: 12px;
  background: #fff;
  border-top: 1px solid #f5f5f5;
  height: 60px; /* 固定信息区域高度 */
}

.schedule-info .title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.schedule-info .episode {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

@media screen and (max-width: 1600px) {
  .schedule-section {
    padding: 20px;
  }

  .anime-schedule-list {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .anime-schedule-list {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }

  .schedule-item {
    padding: 10px;
    height: 100px;
  }

  .schedule-cover {
    width: 70px;
    height: 70px;
  }

  .time {
    font-size: 14px;
    min-width: 50px;
  }
}

/* 确保图片和文字不会影响拖动 */
.schedule-item * {
  pointer-events: none;
}

/* 允许容器本身接收鼠标事件 */
.schedule-scroll-wrapper,
.anime-schedule-list,
.schedule-item {
  pointer-events: auto;
}

.no-data {
  width: 100%;
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.schedule-info .title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  max-width: 100%;
}

/* 统一评分遮罩效果 */
.anime-cover::after,
.schedule-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
      to bottom,
      transparent,
      rgba(0, 0, 0, 0.4)
  );
  pointer-events: none;
}
</style>