<template>
  <div class="anime-detail">
    <div class="main-content" :class="{ 'collapsed': isCollapsed || isAutoCollapsed }">
      <!-- 左侧视频区域 -->
      <div class="video-section">
        <!-- 视频播放器 -->
        <VideoPlayer
            :video-url="currentEpisode?.episodeVideo || ''"
            :poster="currentEpisode?.episodeImage || animeInfo.coverImage"
            :title="animeInfo.title + (currentEpisode ? ' - 第' + currentEpisode.episodeNumber + '集' : '')"
            :is-collapsed="isCollapsed || isAutoCollapsed"
            :video-id="currentEpisode?.episodeId || animeInfo.animeId"
            @toggle-collapse="toggleCollapse"
        />

        <!-- 剧集选择器 -->
        <div class="episodes-selector">
          <div class="episodes-header">
            <h3 class="episodes-title">剧集选择</h3>
            <span class="episodes-count">共{{ episodeList.length }}集</span>
          </div>
          <div class="episodes-scroll-container">
            <div class="episodes-list">
              <div
                v-for="episode in episodeList"
                :key="episode.episodeId"
                class="episode-card"
                :class="{'active': currentEpisode && currentEpisode.episodeId === episode.episodeId}"
                @click="playEpisode(episode)"
              >
                <div class="episode-thumb">
                  <img :src="episode.episodeImage" :alt="episode.episodeTitle">
                </div>
                <div class="episode-info">
                  <div class="episode-number">第{{ episode.episodeNumber }}集</div>
                  <div class="episode-title">{{ episode.episodeTitle }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 番剧信息 -->
        <div class="anime-info">
          <!-- 番剧信息和系列信息的布局容器 -->
          <div class="info-wrapper" :class="{ 'wide-screen': isCollapsed || isAutoCollapsed }">
            <!-- 左侧番剧信息 -->
            <div class="anime-content">
              <!-- 番剧标题和统计信息 -->
              <h1 class="anime-title">{{ animeInfo.title }}</h1>
              <div class="anime-stats">
                <span class="status">{{ getStatusLabel(animeInfo.status) }}</span>
                <span class="bullet">·</span>
                <span class="date">首播于 {{ formatDate(animeInfo.releaseDate) }}</span>
              </div>

              <!-- 添加互动按钮组 -->
              <div class="anime-actions">
                <div class="action-item">
                  <button class="action-btn"
                          :class="{ 'is-active': interactionStates.like }"
                          @click="handleInteraction('like')"
                  >
                    <el-icon>
                      <Star/>
                    </el-icon>
                    收藏
                  </button>
                </div>
                <div class="action-item">
                  <el-button class="action-btn"
                             :class="{ 'is-active': interactionStates.favorite }"
                             @click="handleInteraction('share')">
                    <el-icon>
                      <Share/>
                    </el-icon>
                    分享
                  </el-button>
                </div>
              </div>

              <!-- 添加番剧简介区域 -->
              <div class="anime-description">
                <div class="description-header">
                  <span>番剧简介</span>
                </div>
                <div class="description-content">
                  {{ animeInfo.description || '暂无简介' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comment-section">
          <div class="comment-header">
            <h3>评论 {{ commentCount }}</h3>
          </div>

          <!-- 评论输入框 -->
          <div class="comment-input-area">
            <el-avatar :size="60" :src="userInfo.userPic || defaultAvatar" class="input-avatar"/>
            <div class="input-wrapper">
              <el-input
                  v-model="commentContent"
                  type="textarea"
                  :rows="2"
                  placeholder="发一条友善的评论"
                  resize="none"
                  maxlength="300"
                  show-word-limit
              />
              <div class="comment-tools">
                <div class="emoji-picker">
                  <el-icon>
                    <ChatRound/>
                  </el-icon>
                  表情
                </div>
                <el-button type="primary" :disabled="!commentContent.trim()" @click="submitComment">
                  发布评论
                </el-button>
              </div>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comment-list">
            <div v-if="comments.length === 0" class="empty-comment">
              暂无评论，快来发表第一条评论吧！
            </div>
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <el-avatar :size="48" :src="comment.userPic || defaultAvatar" class="comment-avatar"/>
              <div class="comment-content">
                <div class="comment-user">
                  {{ comment.nickname }}
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-info">
                  <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
                  <div class="comment-actions">
                    <span class="action-item">
                      <el-icon></el-icon>
                      {{ comment.likeCount || 0 }}
                    </span>
                    <span class="action-item" @click="handleReply(comment)">
                      <el-icon><ChatDotRound/></el-icon>
                      回复
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ChatDotRound, ChatRound, Star, Share} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import useUserInfoStore from '@/stores/userInfo'
import {useTokenStore} from '@/stores/token'
import {getAnimeDetailService} from '@/api/anime/animeEpisode'
import {formatDate} from '@/utils/format'

const route = useRoute()
const router = useRouter()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 用户信息
const userInfoStore = useUserInfoStore()
const userInfo = computed(() => userInfoStore.info)
const tokenStore = useTokenStore()
const isLogin = computed(() => !!tokenStore.token)

// 番剧详情数据模型
const animeInfo = ref({
  animeId: null,
  title: '',
  coverImage: '',
  description: '',
  releaseDate: '',
  status: '',
  episodes: []
})

// 剧集列表
const episodeList = ref([])
// 当前播放的剧集
const currentEpisode = ref(null)
// 评论数据
const comments = ref([])
const commentContent = ref('')
const commentCount = ref(0)

// 互动状态
const interactionStates = ref({
  like: false,
  share: false
})

// 添加收缩状态控制
const isCollapsed = ref(false)
const isAutoCollapsed = ref(false)

// 切换收缩状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 获取番剧ID
const animeId = computed(() => route.params.id || route.query.id)
// 获取剧集ID
const episodeId = computed(() => route.query.episodeId)

// 获取番剧详情
const loadAnimeInfo = async () => {
  try {
    if (!animeId.value) {
      ElMessage.error('参数错误，未找到番剧ID')
      router.push('/anime')
      return
    }

    // 获取番剧详情
    const result = await getAnimeDetailService(animeId.value)
    if (result.data) {
      animeInfo.value = result.data
      episodeList.value = result.data.episodes || []

      // 如果有指定的剧集ID，则播放该剧集
      if (episodeId.value) {
        const episode = episodeList.value.find(ep => ep.episodeId === parseInt(episodeId.value))
        if (episode) {
          playEpisode(episode)
        } else if (episodeList.value.length > 0) {
          // 如果未找到指定剧集，播放第一集
          playEpisode(episodeList.value[0])
        }
      } else if (episodeList.value.length > 0) {
        // 默认播放第一集
        playEpisode(episodeList.value[0])
      } else {
        // 没有剧集数据
        ElMessage.warning('该番剧暂无剧集')
      }
    } else {
      ElMessage.error('获取番剧详情数据为空')
      router.push('/anime')
    }
  } catch (error) {
    console.error('获取番剧详情失败:', error)
    ElMessage.error('获取番剧详情失败')
    router.push('/anime')
  }
}

// 播放指定剧集
const playEpisode = (episode) => {
  currentEpisode.value = episode

  // 更新URL参数，但不重新加载页面
  router.replace({
    query: {...route.query, episodeId: episode.episodeId}
  })
}

// 获取番剧状态标签
const getStatusLabel = (status) => {
  const statusMap = {
    'ongoing': '连载中',
    'completed': '已完结',
    'upcoming': '即将上映',
    'hiatus': '暂停'
  }
  return statusMap[status] || '未知'
}

// 处理互动
const handleInteraction = (action) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }

  interactionStates.value[action] = !interactionStates.value[action]
  ElMessage.success(interactionStates.value[action] ? '操作成功' : '已取消')
}

// 发表评论
const submitComment = () => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  // 模拟添加评论
  const newComment = {
    id: Date.now(),
    nickname: userInfo.value.nickname,
    userPic: userInfo.value.userPic || defaultAvatar,
    content: commentContent.value,
    createTime: new Date(),
    likeCount: 0
  }

  comments.value.unshift(newComment)
  commentCount.value++
  commentContent.value = ''
  ElMessage.success('评论发表成功')
}

// 回复评论
const handleReply = (comment) => {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }

  commentContent.value = `@${comment.nickname} `
  // 滚动到评论区
  document.querySelector('.comment-input-area')?.scrollIntoView({behavior: 'smooth'})
}

// 监听窗口大小变化
const handleResize = () => {
  isAutoCollapsed.value = window.innerWidth < 1200
}

// 组件挂载和卸载时添加/移除事件监听
onMounted(() => {
  loadAnimeInfo()
  handleResize() // 初始化状态
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听路由参数变化
watch(() => route.params.id, (newVal) => {
  if (newVal) {
    loadAnimeInfo()
  }
})

// 监听剧集ID变化
watch(() => route.query.episodeId, (newVal) => {
  if (newVal && episodeList.value.length > 0) {
    const episode = episodeList.value.find(ep => ep.episodeId === parseInt(newVal))
    if (episode && (!currentEpisode.value || currentEpisode.value.episodeId !== episode.episodeId)) {
      playEpisode(episode)
    }
  }
})

</script>

<style scoped>
.anime-detail {
  min-height: 100vh;
  background-color: #f1f2f3;
  padding: 20px 0;
}

/* 使用网格布局包装整个内容 */
.main-content {
  width: 100%;
  position: relative;
  max-width: 2160px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 0 20px;
  transition: all 0.3s ease-in-out;
}

.main-content.collapsed {
  max-width: none;
  padding: 0;
}

/* 视频区域样式 */
.video-section {
  width: 100%;
  position: relative;
  transition: all 0.3s ease-in-out;
  min-width: 0;
  max-width: 1760px;
  margin: 0 auto;
  padding: 0;
}

/* 宽屏模式下的右侧区域样式 */
.collapsed .video-section {
  max-width: none;
  margin: 0;
}

/* 剧集选择器样式 */
.episodes-selector {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.episodes-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.episodes-count {
  font-size: 14px;
  color: #666;
}

.episodes-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.episodes-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.episodes-list {
  display: flex;
  gap: 16px;
  padding: 4px;
}

.episode-card {
  min-width: 200px;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.episode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.episode-card.active {
  border: 2px solid #ff6b6b;
}

.episode-thumb {
  position: relative;
  width: 100%;
  height: 112px;
  overflow: hidden;
}

.episode-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.episode-card:hover .episode-thumb img {
  transform: scale(1.05);
}

.episode-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.episode-info {
  padding: 12px;
}

.episode-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.episode-title {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 番剧信息样式 */
.anime-info {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.anime-title {
  font-size: 24px;
  font-weight: 600;
  color: #18191c;
  margin-bottom: 8px;
  line-height: 1.4;
}

.anime-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9499a0;
  font-size: 14px;
  margin-bottom: 20px;
}

.bullet {
  color: #9499a0;
  margin: 0 4px;
}

/* 番剧简介样式 */
.anime-description {
  background: #f6f7f8;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.description-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #18191c;
  font-weight: 500;
}

.description-content {
  color: #61666d;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 互动按钮样式 */
.anime-actions {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-top: 12px;
  border-bottom: 1px solid #f1f2f3;
}

.action-item {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #61666d;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.action-btn:hover {
  color: #ff6b6b;
}

.action-btn.is-active {
  color: #ff6b6b;
}

/* 评论区样式 */
.comment-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.comment-header {
  margin-bottom: 24px;
}

.comment-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #18191c;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f2f3;
}

.input-avatar {
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emoji-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #61666d;
  transition: all 0.3s;
  font-size: 14px;
}

.emoji-picker:hover {
  background: #f4f5f7;
  color: #ff6b6b;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-comment {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.comment-item:hover {
  background: #f9f9f9;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: #ff6b6b;
  margin-bottom: 6px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #18191c;
  margin-bottom: 8px;
  word-break: break-word;
}

.comment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9499a0;
}

.comment-time {
  color: #9499a0;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 10px;
  }
}

@media (max-width: 768px) {
  .anime-detail {
    padding: 10px 0;
  }

  .main-content {
    padding: 0;
  }

  .comment-section,
  .anime-info {
    padding: 16px;
    border-radius: 0;
  }

  .anime-title {
    font-size: 20px;
  }

  .anime-actions {
    padding: 12px;
  }

  .action-btn {
    padding: 8px 16px;
    font-size: 14px;
  }

  .comment-input-area {
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 16px;
  }
  
  .episodes-selector {
    padding: 16px;
    border-radius: 0;
  }
  
  .episode-card {
    min-width: 150px;
    max-width: 150px;
  }
  
  .episode-thumb {
    height: 84px;
  }
}
</style>