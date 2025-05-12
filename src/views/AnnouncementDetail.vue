<template>
  <div class="announcement-detail-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 公告不存在 -->
    <div v-else-if="!announcement" class="empty-state">
      <el-empty description="未找到该公告" />
      <el-button type="primary" @click="goBack" class="back-home-btn">返回首页</el-button>
    </div>

    <!-- 公告内容 -->
    <div v-else class="announcement-container">
        <el-button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="announcement-header">
        <h1 class="announcement-title">标题：{{ announcement.title }}</h1>
      </div>

      <div class="announcement-content">
        <p class="content-text">{{ announcement.text }}</p>
      </div>

      <!-- 图片展示 -->
      <div v-if="announcement.imageUrl" class="media-section">
        <el-image 
          :src="announcement.imageUrl" 
          :preview-src-list="[announcement.imageUrl]"
          fit="contain"
          class="announcement-image"
        />
      </div>

      <!-- 视频展示 -->
      <div v-if="announcement.videoUrl" class="media-section">
        <video 
          :src="announcement.videoUrl"
          controls
          class="announcement-video"
        ></video>
      </div>
    </div>

    <!-- 推荐公告 -->
    <div v-if="relatedAnnouncements.length > 0" class="related-announcements">
      <h3 class="section-title">其他公告</h3>
      <div class="related-list">
        <div 
          v-for="item in relatedAnnouncements" 
          :key="item.announcementId" 
          class="related-item"
          @click="viewAnnouncement(item.announcementId)"
        >
          <div class="related-title">{{ item.title }}</div>
          <div class="related-time">{{ formatDate(item.createTime) || '未知时间' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getAnnouncementListService } from '@/api/Announcement'

const route = useRoute()
const router = useRouter()
const announcementId = ref(null)
const announcement = ref(null)
const relatedAnnouncements = ref([])
const loading = ref(true)

// 添加开发环境标志
const isDev = computed(() => {
  return import.meta.env.DEV
})

// 获取公告详情
const fetchAnnouncementDetail = async () => {
  loading.value = true
  try {
    // 获取公告列表
    const res = await getAnnouncementListService()
    console.log('API返回的公告数据:', res)
    
    if (res.code === 200 && res.data) {
      // 找到当前公告 - 使用announcementId作为正确的属性名
      const found = res.data.find(item => item.announcementId == announcementId.value)
      console.log('找到的公告详情:', found)
      console.log('当前查找的announcementId:', announcementId.value, '类型:', typeof announcementId.value)
      console.log('所有公告的ID:', res.data.map(item => ({id: item.announcementId, type: typeof item.announcementId})))
      
      if (found) {
        announcement.value = found
        // 获取其他相关公告（除了当前公告外的最多5条）
        relatedAnnouncements.value = res.data
          .filter(item => item.announcementId != announcementId.value)
          .slice(0, 5)
      } else {
        announcement.value = null
        ElMessage.warning('未找到该公告')
      }
    } else {
      announcement.value = null
      ElMessage.error(res.message || '获取公告详情失败')
    }
  } catch (error) {
    console.error('获取公告详情失败:', error)
    ElMessage.error('获取公告详情失败，请稍后重试')
    announcement.value = null
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未知时间'
  
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回上一页
const goBack = () => {
  router.push('/')
}

// 查看其他公告
const viewAnnouncement = (id) => {
  console.log('查看公告，ID:', id, '类型:', typeof id)
  router.push(`/announcement/${id}`)
  // 刷新当前页面数据
  announcementId.value = id
  fetchAnnouncementDetail()
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 组件挂载时获取数据
onMounted(() => {
  // 从路由参数获取公告ID - 使用announcementId
  announcementId.value = route.params.id
  console.log('公告ID:', announcementId.value)
  
  if (!announcementId.value) {
    ElMessage.warning('公告ID无效')
    router.push('/')
    return
  }
  
  // 获取公告详情
  fetchAnnouncementDetail()
})
</script>

<style scoped>
.announcement-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 120px);
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.placeholder {
  width: 80px;
}

.loading-container {
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.back-home-btn {
  margin-top: 20px;
}

.announcement-container {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.announcement-header {
  margin-bottom: 25px;
  text-align: center;
}

.announcement-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.announcement-meta {
  color: #909399;
  font-size: 14px;
}

.announcement-content {
  line-height: 1.8;
  color: #606266;
  font-size: 16px;
  margin-bottom: 30px;
}

.content-text {
  white-space: pre-line;
}

.media-section {
  margin: 20px 0;
  text-align: center;
}

.announcement-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
}

.announcement-video {
  max-width: 100%;
  max-height: 500px;
  border-radius: 4px;
  background-color: black;
}

.related-announcements {
  margin-top: 40px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.related-item:hover {
  background-color: #f5f7fa;
}

.related-title {
  font-size: 15px;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-time {
  color: #909399;
  font-size: 13px;
  margin-left: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .announcement-detail-page {
    padding: 15px;
  }
  
  .announcement-container {
    padding: 20px;
  }
  
  .announcement-title {
    font-size: 20px;
  }
  
  .announcement-content {
    font-size: 15px;
  }
}

.debug-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
  text-align: left;
  border: 1px solid #ddd;
}
</style> 