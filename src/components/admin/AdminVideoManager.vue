<template>
  <div class="video-content">
    <!-- 顶部操作区域 -->
    <div class="header-actions">
      <h2 class="section-title">视频审核</h2>
      <div class="action-group">
        <el-select v-model="filterStatus" placeholder="筛选状态" class="filter-select">
          <el-option label="全部视频" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="筛选分类" class="filter-select">
          <el-option label="全部分类" :value="-1" />
          <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
        <el-button type="primary" @click="refreshData" class="refresh-button">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="videoList.length === 0 && !loading">
      <el-empty description="暂无视频内容">
        <template #description>
          <p class="empty-text">暂无待审核视频</p>
        </template>
      </el-empty>
    </div>

    <!-- 视频列表展示 -->
    <div class="video-list" v-if="videoList.length > 0">
      <div v-for="video in videoList" :key="video.id" class="video-card">
        <div class="video-cover-wrap">
          <img :src="video.cover" class="video-cover" alt="图片获取失败"/>
          <div class="cover-actions" v-if="video.videoUrl">
            <el-button
              @click="handlePreview(video)"
            >
              <img :src="VideoFill" class="preview-icon" alt="预览" />
            </el-button>
          </div>
        </div>
        <div class="video-info">
          <!-- 顶部审核按钮区域 -->
          <div class="top-audit-actions">
            <h3 class="video-title">{{ video.title }}</h3>
            <div class="actions-group">
              <el-button 
                size="small" 
                type="success"
                @click="handleCardAudit(video.id, video.title)"
                class="top-audit-btn"
              >
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button 
                size="small" 
                type="danger"
                @click="handleCardReject(video.id, video.title)"
                class="top-audit-btn"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
            </div>
          </div>

          <p class="video-description">{{ video.content || '暂无简介' }}</p>
          <div class="video-meta">
            <span class="uploader">UP主: {{ video.nickname || '未知用户' }}</span>
            <span class="create-time">发布时间: {{ formatDate(video.createTime) }}</span>
            <span class="category-tag" v-if="getCategoryName(video.categoryId)">
              分类: {{ getCategoryName(video.categoryId) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-container" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="视频预览"
      width="80%"
      class="preview-dialog"
      destroy-on-close
    >
      <div class="video-preview-container">
        <video 
          v-if="currentVideo.videoUrl" 
          controls 
          class="preview-video" 
          :src="currentVideo.videoUrl"
        ></video>
        <div class="video-preview-info">
          <h3>{{ currentVideo.title }}</h3>
          <p class="video-description">{{ currentVideo.content || '暂无简介' }}</p>
          <div class="video-meta">
            <span>UP主: {{ currentVideo.nickname || '未知用户' }}</span>
            <span>创建时间: {{ formatDate(currentVideo.createTime) }}</span>
            <span class="category-tag" v-if="getCategoryName(currentVideo.categoryId)">
              分类: {{ getCategoryName(currentVideo.categoryId) }}
            </span>
          </div>
          <div class="preview-actions" v-if="currentVideo.status === 0">
            <el-button type="success" @click="handleQuickApprove">
              <el-icon><Check /></el-icon>
              通过审核
            </el-button>
            <el-button type="danger" @click="handleQuickReject">
              <el-icon><Close /></el-icon>
              拒绝发布
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 操作确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      :title="confirmDialogTitle"
      width="30%"
    >
      <span>{{ confirmDialogMessage }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmAction">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVideoDraftListService, AuditVideo } from '@/api/admin/adminVideo'
import { Check, Close, Refresh } from '@element-plus/icons-vue'
import Video from '@/assets/iconsvg/adminVideo.svg'
import VideoFill from '@/assets/iconsvg/video_fill.svg'

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
  { id: 15, name: '娱乐' }
])

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  const category = categories.value.find(c => c.id == categoryId)
  return category ? category.name : ''
}

// 数据加载状态
const loading = ref(false)

// 视频列表数据
const videoList = ref([])

// 筛选状态
const filterStatus = ref(-1)

// 筛选分类
const filterCategory = ref(-1)

// 分页信息
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 预览对话框
const previewDialogVisible = ref(false)
const currentVideo = ref({})

// 确认对话框
const confirmDialogVisible = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const currentAction = ref('')
const selectedRow = ref(null)

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

// 获取视频列表数据
const fetchVideoList = async () => {
  loading.value = true
  try {
    const response = await getVideoDraftListService()
    if (response && response.data) {
      // 获取所有视频
      let allVideos = response.data || []
      
      // 根据状态筛选
      if (filterStatus.value !== -1) {
        allVideos = allVideos.filter(video => video.status === filterStatus.value)
      }
      
      // 根据分类筛选
      if (filterCategory.value !== -1) {
        allVideos = allVideos.filter(video => video.categoryId === filterCategory.value)
      }
      
      // 更新视频列表
      videoList.value = allVideos
      
      // 如果后端返回了分页信息，则更新
      if (response.pageNum) pagination.value.pageNum = response.pageNum
      if (response.pageSize) pagination.value.pageSize = response.pageSize
      if (response.total) pagination.value.total = response.total
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
    ElMessage.error('获取视频列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听筛选状态变化
watch([filterStatus, filterCategory], () => {
  fetchVideoList()
})

// 刷新数据
const refreshData = () => {
  fetchVideoList()
}

// 处理预览
const handlePreview = (video) => {
  currentVideo.value = video
  previewDialogVisible.value = true
}

// 预览对话框中快速审核通过
const handleQuickApprove = async () => {
  ElMessageBox.confirm(
    `确定要通过视频 "${currentVideo.value.title}" 的审核吗？`,
    '审核确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      await AuditVideo(currentVideo.value.id)
      ElMessage.success(`已通过视频 "${currentVideo.value.title}" 的审核`)
      previewDialogVisible.value = false
      await fetchVideoList()
    } catch (error) {
      console.error('审核失败:', error)
      ElMessage.error('审核操作失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 预览对话框中快速拒绝
const handleQuickReject = () => {
  handleCommand('reject', currentVideo.value)
  previewDialogVisible.value = false
}

// 处理下拉菜单命令
const handleCommand = (command, video) => {
  selectedRow.value = video
  
  switch (command) {
    case 'approve':
      ElMessageBox.confirm(
        `确定要通过视频 "${video.title}" 的审核吗？`,
        '审核确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        }
      ).then(async () => {
        try {
          await AuditVideo(video.id)
          ElMessage.success(`已通过视频 "${video.title}" 的审核`)
          fetchVideoList()
        } catch (error) {
          console.error('审核失败:', error)
          ElMessage.error('审核操作失败，请稍后重试')
        }
      }).catch(() => {
        // 用户取消操作
      })
      break
      
    case 'reject':
      confirmDialogTitle.value = '拒绝发布'
      confirmDialogMessage.value = `确定要拒绝视频 "${video.title}" 的发布申请吗？`
      currentAction.value = 'reject'
      confirmDialogVisible.value = true
      break
      
    case 'delete':
      confirmDialogTitle.value = '删除视频'
      confirmDialogMessage.value = `确定要删除视频 "${video.title}" 吗？此操作不可恢复！`
      currentAction.value = 'delete'
      confirmDialogVisible.value = true
      break
  }
}

// 处理确认操作
const handleConfirmAction = async () => {
  const video = selectedRow.value
  
  try {
    switch (currentAction.value) {
      case 'reject':
        // 这里调用拒绝发布API，如果有专门的API
        ElMessage.info(`已拒绝视频 "${video.title}" 的发布申请`)
        break
        
      case 'delete':
        // 这里调用删除视频API，如果有专门的API
        ElMessage.success(`已删除视频 "${video.title}"`)
        break
    }
    
    // 关闭对话框并刷新数据
    confirmDialogVisible.value = false
    fetchVideoList()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  fetchVideoList()
}

// 处理页码变化
const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage
  fetchVideoList()
}

// 直接在卡片上审核
const handleCardAudit = async (id, title) => {
  ElMessageBox.confirm(
    `确定要通过视频 "${title}" 的审核吗？`,
    '审核确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      await AuditVideo(id)
      ElMessage.success(`已通过视频 "${title}" 的审核`)
      fetchVideoList()
    } catch (error) {
      console.error('审核失败:', error)
      ElMessage.error('审核操作失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 直接在卡片上拒绝
const handleCardReject = (id, title) => {
  ElMessageBox.confirm(
    `确定要拒绝视频 "${title}" 的发布申请吗？`,
    '拒绝发布',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info(`已拒绝视频 "${title}" 的发布申请`)
    fetchVideoList()
  }).catch(() => {
    // 用户取消操作
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchVideoList()
})
</script>

<style scoped>
.video-content {
  width: 100%;
  padding: 10px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 22px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.video-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(750px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.video-card {
  display: flex;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.video-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.video-cover-wrap {
  width: 240px;
  height: 150px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.video-card:hover .video-cover {
  transform: scale(1.05);
}

.cover-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 12px;
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .cover-actions {
  opacity: 1;
}



.preview-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(0.4) sepia(1) saturate(10) hue-rotate(300deg);
}



.video-info {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-audit-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.video-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-audit-btn {
  font-weight: bold;
  padding: 8px 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.top-audit-btn.el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
  color: white;
}

.top-audit-btn.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.top-audit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}


.video-description {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

/* 分类标签样式 */
.category-tag {
  display: inline-flex;
  align-items: center;
  background-color: #fb729915;
  color: #fb7299;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.category-tag::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #fb7299;
  margin-right: 4px;
}

/* 分页器样式 */
.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 视频预览对话框 */
.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.video-preview-container {
  display: flex;
  flex-direction: column;
}

.preview-video {
  width: 100%;
  max-height: 500px;
  background: #000;
}

.video-preview-info {
  padding: 20px;
}

.preview-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 空状态样式 */
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

/* Element Plus 主题覆盖 */
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

:deep(.el-button--success) {
  background-color: #67c23a;
  border-color: #67c23a;
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-card {
    height: auto;
    flex-direction: column;
  }

  .video-cover-wrap {
    width: 100%;
    height: 180px;
  }

  .video-info {
    padding: 12px;
  }

  .video-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}


.audit-buttons .el-button {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.action-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  width: 120px;
  margin-right: 10px;
}
</style> 