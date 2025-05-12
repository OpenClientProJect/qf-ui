<template>
  <div class="video-review-content">
    <h2 class="section-title">视频审核</h2>
    
    <!-- 标签页切换不同审核状态 -->
    <el-tabs v-model="activeTab" class="review-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="待审核" name="pending"></el-tab-pane>
      <el-tab-pane label="已通过" name="approved"></el-tab-pane>
      <el-tab-pane label="已拒绝" name="rejected"></el-tab-pane>
    </el-tabs>
    
    <!-- 视频列表区域 -->
    <div class="video-list" v-if="videos.length > 0">
      <div v-for="video in videos" :key="video.id" class="video-card">
        <div class="video-cover-wrap">
          <img :src="video.cover" class="video-cover" alt="图片获取失败"/>
          <div class="status-badge" :class="getStatusClass(video.status)">
            {{ getStatusText(video.status) }}
          </div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <p class="video-description">简介：{{ video.content }}</p>
          <div class="video-meta">
            <span class="category-tag" v-if="getCategoryName(video.categoryId)">
              {{ getCategoryName(video.categoryId) }}
            </span>
            <span class="user-tag">
              <el-icon><User /></el-icon>
              {{ video.nickname || '未知用户' }}
            </span>
            <span class="time-tag">
              <el-icon><Clock /></el-icon>
              {{ formatDate(video.createTime) }}
            </span>
          </div>
          
          <!-- 操作按钮 -->
          <div class="video-actions" v-if="activeTab === 'pending'">
            <el-button type="success" size="small" @click="approveVideo(video.id)">通过</el-button>
            <el-button type="danger" size="small" @click="openRejectDialog(video.id)">拒绝</el-button>
            <el-button type="primary" size="small" @click="previewVideo(video)">预览</el-button>
          </div>
        </div>
      </div>
      
      <!-- 分页组件 - 仅在数据大于pageSize时显示 -->
      <div class="pagination-container" v-if="pagination.total > pagination.pageSize">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          background
        />
      </div>
    </div>
    
    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <el-empty :description="emptyText">
        <template #description>
          <p class="empty-text">{{ emptyText }}</p>
        </template>
      </el-empty>
    </div>
    
    <!-- 拒绝理由对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝理由"
      width="500px"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝理由">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝理由"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="rejectVideo">确认拒绝</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="视频预览"
      width="70%"
      class="preview-dialog"
    >
      <div class="video-preview-container">
        <video 
          v-if="selectedVideo.videoUrl" 
          :src="selectedVideo.videoUrl" 
          controls 
          class="video-player"
        ></video>
        <div class="video-preview-info">
          <h3>{{ selectedVideo.title }}</h3>
          <p>{{ selectedVideo.content }}</p>
          <div class="preview-meta">
            <span>分类：{{ getCategoryName(selectedVideo.categoryId) }}</span>
            <span>上传者：{{ selectedVideo.nickname }}</span>
            <span>上传时间：{{ formatDate(selectedVideo.createTime) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialogVisible = false">关闭</el-button>
          <el-button type="success" @click="approveVideo(selectedVideo.id)">通过</el-button>
          <el-button type="danger" @click="openRejectDialog(selectedVideo.id)">拒绝</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Clock } from '@element-plus/icons-vue'
import { formatDate } from "@/utils/format"
import { approveVideoService, getVideoReviewListService } from '@/api/admin/admin'

// 视频分类列表
const categories = ref([
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
  { id: 15, name: '娱乐' },
  // 添加缺失的分类
  { id: 105, name: '舞蹈' },
  { id: 106, name: '游戏' },
  { id: 202, name: '科技' },
  { id: 203, name: '娱乐' }
])

// 视频列表数据
const allVideos = ref([]) // 存储所有获取到的视频
const videos = ref([]) // 当前显示的视频列表
const activeTab = ref('pending')
const emptyText = computed(() => {
  const texts = {
    pending: '暂无待审核视频',
    approved: '暂无已通过的视频',
    rejected: '暂无已拒绝的视频'
  }
  return texts[activeTab.value]
})

// 分页相关
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 拒绝对话框相关
const rejectDialogVisible = ref(false)
const rejectForm = ref({
  videoId: null,
  reason: ''
})

// 预览对话框相关
const previewDialogVisible = ref(false)
const selectedVideo = ref({})

// 状态相关函数
const getStatusText = (status) => {
  switch (parseInt(status)) {
    case 1: return '待审核'
    case 2: return '已通过'
    case 3: return '已拒绝'
    default: return '未知状态'
  }
}

const getStatusClass = (status) => {
  switch (parseInt(status)) {
    case 1: return 'status-pending'
    case 2: return 'status-approved'
    case 3: return 'status-rejected'
    default: return ''
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  const category = categories.value.find(c => c.id === parseInt(categoryId))
  return category ? category.name : '未知分类'
}

// 获取视频列表
const getVideoList = async () => {
  try {
    const result = await getVideoReviewListService()
    
    if (Array.isArray(result.data)) {
      // 保存所有视频
      allVideos.value = result.data
      // 根据当前标签页过滤视频
      filterVideos()
    } else {
      console.error('API返回格式不符合预期:', result)
      ElMessage.error('获取视频列表失败，返回格式不符合预期')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
    ElMessage.error('获取视频列表失败，请稍后重试')
  }
}

// 根据当前标签页过滤视频
const filterVideos = () => {
  let status = 1 // 默认为待审核
  if (activeTab.value === 'approved') status = 2
  if (activeTab.value === 'rejected') status = 3
  
  // 过滤出当前状态的视频
  const filteredVideos = allVideos.value.filter(video => parseInt(video.status) === status)
  
  // 处理分页
  const start = (pagination.value.pageNum - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  
  videos.value = filteredVideos.slice(start, end)
  pagination.value.total = filteredVideos.length
}

// 处理标签页切换
const handleTabClick = () => {
  pagination.value.pageNum = 1 // 重置页码
  filterVideos()
}

// 分页处理
const handlePageChange = (newPage) => {
  pagination.value.pageNum = newPage
  filterVideos()
}

const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  pagination.value.pageNum = 1
  filterVideos()
}

// 监听activeTab变化
watch(activeTab, () => {
  filterVideos()
})

// 审核操作
const approveVideo = async (videoId) => {
  try {
    await ElMessageBox.confirm('确认通过这个视频的审核吗？', '审核确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    await approveVideoService(videoId, true)
    ElMessage.success('视频审核已通过')
    
    // 更新本地视频状态
    const videoIndex = allVideos.value.findIndex(v => v.id === videoId)
    if (videoIndex !== -1) {
      allVideos.value[videoIndex].status = 2
      filterVideos()
    } else {
      // 如果本地数据没找到，重新获取所有数据
      await getVideoList()
    }
    
    // 如果预览对话框打开，则关闭
    if (previewDialogVisible.value) {
      previewDialogVisible.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核操作失败:', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

const openRejectDialog = (videoId) => {
  rejectForm.value.videoId = videoId
  rejectForm.value.reason = ''
  rejectDialogVisible.value = true
}

const rejectVideo = async () => {
  if (!rejectForm.value.reason.trim()) {
    ElMessage.warning('请填写拒绝理由')
    return
  }
  
  try {
    await approveVideoService(rejectForm.value.videoId, false)
    
    ElMessage.success('已拒绝该视频')
    rejectDialogVisible.value = false
    
    // 更新本地视频状态
    const videoIndex = allVideos.value.findIndex(v => v.id === rejectForm.value.videoId)
    if (videoIndex !== -1) {
      allVideos.value[videoIndex].status = 3
      filterVideos()
    } else {
      // 如果本地数据没找到，重新获取所有数据
      await getVideoList()
    }
    
    // 如果预览对话框打开，则关闭
    if (previewDialogVisible.value) {
      previewDialogVisible.value = false
    }
  } catch (error) {
    console.error('拒绝操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 视频预览
const previewVideo = (video) => {
  selectedVideo.value = {...video}
  previewDialogVisible.value = true
}

// 初始化
onMounted(() => {
  getVideoList()
})
</script>

<style scoped>
.video-review-content {
  width: 100%;
}

.section-title {
  font-size: 20px;
  color: #18191c;
  margin-bottom: 20px;
  font-weight: 600;
}

.review-tabs {
  margin-bottom: 20px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px;
}

.video-card {
  display: flex;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e3e5e7;
  min-height: 140px;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover-wrap {
  width: 240px;
  height: 140px;
  flex-shrink: 0;
  position: relative;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.status-pending {
  background-color: #E6A23C;
  color: #fff;
}

.status-approved {
  background-color: #67C23A;
  color: #fff;
}

.status-rejected {
  background-color: #F56C6C;
  color: #fff;
}

.video-info {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.video-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #18191c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  margin-bottom: 8px;
}

.video-description {
  font-size: 14px;
  color: #61666d;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  max-height: 40px;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #9499a0;
  margin-bottom: 12px;
}

.category-tag, .user-tag, .time-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.category-tag {
  background-color: #fb729930;
  color: #fb7299;
  padding: 2px 6px;
  border-radius: 4px;
}

.video-actions {
  display: flex;
  gap: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 10px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-text {
  color: #666;
  font-size: 14px;
  margin: 16px 0;
}

/* 视频预览相关样式 */
.video-preview-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-player {
  width: 100%;
  max-height: 500px;
  background: #000;
}

.video-preview-info {
  padding: 0 10px;
}

.video-preview-info h3 {
  font-size: 18px;
  color: #18191c;
  margin-bottom: 12px;
}

.video-preview-info p {
  font-size: 14px;
  color: #61666d;
  line-height: 1.6;
  margin-bottom: 16px;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: #9499a0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-card {
    flex-direction: column;
    height: auto;
  }

  .video-cover-wrap {
    width: 100%;
    height: 180px;
  }

  .video-actions {
    justify-content: center;
    margin-top: 10px;
  }
  
  .preview-dialog {
    width: 95%;
  }
}

:deep(.el-tabs__item.is-active) {
  color: #fb7299;
}

:deep(.el-tabs__active-bar) {
  background-color: #fb7299;
}

:deep(.el-button--primary) {
  background-color: #fb7299;
  border-color: #fb7299;
}

:deep(.el-button--primary:hover) {
  background-color: #fc8bab;
  border-color: #fc8bab;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #fb7299;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #fb7299;
}
</style> 