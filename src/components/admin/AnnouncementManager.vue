<template>
  <div class="announcement-manager">
    <!-- 顶部操作区域 -->
    <div class="header-actions">
      <h2 class="section-title">公告管理</h2>
      <div class="action-group">
        <el-button type="primary" @click="openAnnouncementDialog(false)">
          <el-icon><Plus /></el-icon>
          发布公告
        </el-button>
        <el-button @click="loadAnnouncements" class="refresh-button">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div class="empty-state" v-if="announcements.length === 0 && !loading">
      <el-empty description="暂无公告内容">
        <template #description>
          <p class="empty-text">暂无已发布的公告</p>
        </template>
      </el-empty>
    </div>
    
    <!-- 公告列表 -->
    <div class="announcement-list" v-if="announcements.length > 0">
      <div v-for="item in announcements" :key="item.announcementId" class="announcement-card">
        <div class="announcement-media">
          <div class="media-content" v-if="item.imageUrl || item.videoUrl">
            <!-- 图片点击可预览视频 -->
            <div 
              v-if="item.imageUrl" 
              class="image-preview"
              :class="{'has-video': item.videoUrl, 'image-only': !item.videoUrl}"
              @click="item.videoUrl ? toggleVideo(item.announcementId) : null"
            >
              <el-image 
                v-show="!activeVideos[item.announcementId]"
                :src="item.imageUrl" 
                :preview-src-list="[]"
                fit="cover"
                class="content-image"
                :style="item.videoUrl ? 'cursor: pointer' : ''"
                @click.stop
              />
              <video 
                v-show="activeVideos[item.announcementId]"
                :id="`video-${item.announcementId}`"
                :src="item.videoUrl"
                class="content-video"
                controls
                @ended="activeVideos[item.announcementId] = false"
              ></video>
              <div v-if="item.videoUrl && !activeVideos[item.announcementId]" class="video-indicator">
                <el-icon><VideoPlay /></el-icon>
                <span>点击播放视频</span>
              </div>
            </div>
            <!-- 视频缩略图 -->
            <div v-else-if="item.videoUrl" class="video-thumbnail" @click="toggleVideo(item.announcementId)">
              <div class="play-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="view-video">
                点击播放视频
              </div>
            </div>
          </div>
          <!-- 视频预览按钮 -->
          <div class="cover-actions" v-if="item.videoUrl && !item.imageUrl">
            <el-button @click="previewVideo(item)">
              <img :src="VideoFill" class="preview-icon" alt="预览" />
            </el-button>
          </div>
        </div>
        
        <div class="announcement-info">
          <!-- 顶部标题和操作按钮 -->
          <div class="top-actions">
            <h3 class="announcement-title">{{ item.title }}</h3>
            <div class="actions-group">
              <el-button
                size="small" 
                type="danger"
                @click="deleteAnnouncement(item.announcementId)"
                class="top-action-btn"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
          
          <p class="announcement-content">{{ item.text }}</p>
          <div class="announcement-meta">
            <span class="create-time">发布时间: {{ formatDate(item.createTime) }}</span>
            <span class="media-tag video-tag" v-if="item.videoUrl">
              包含视频
            </span>
            <span class="media-tag" v-if="item.imageUrl">
              包含图片
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 公告表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      width="600px"
      :close-on-click-modal="false"
      class="announcement-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        status-icon
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="text">
          <el-input
            v-model="form.text"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            class="upload-container"
            action="/api/file/uploadImage"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleRemove"
            :file-list="fileList"
            :limit="1"
            list-type="picture-card"
            :headers="uploadHeaders"
            name="image"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过20MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频">
          <el-upload
            class="upload-container"
            action="/api/file/uploadVideo"
            :on-success="handleVideoUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleVideoRemove"
            :file-list="videoFileList"
            :limit="1"
            :headers="uploadHeaders"
            name="video"
          >
            <el-button type="primary">上传视频</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传mp4格式视频，且不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="formLoading">
            {{ isEdit ? '更新' : '发布' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="videoPreviewVisible"
      title="视频预览"
      width="70%"
      class="preview-dialog"
      destroy-on-close
    >
      <div class="video-preview-container">
        <video 
          v-if="currentAnnouncement.videoUrl" 
          controls 
          class="preview-video" 
          :src="currentAnnouncement.videoUrl"
        ></video>
        <div class="video-preview-info">
          <h3>{{ currentAnnouncement.title }}</h3>
          <p class="video-description">{{ currentAnnouncement.text || '暂无简介' }}</p>
          <div class="video-meta">
            <span>发布时间: {{ formatDate(currentAnnouncement.createTime) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {  Plus, Delete, Refresh, VideoPlay } from '@element-plus/icons-vue'
import { 
  publishAnnouncementService, 
  getAnnouncementListService, 
  deleteAnnouncementService,
} from '@/api/Announcement'
import { useTokenStore } from '@/stores/token'
import VideoFill from '@/assets/iconsvg/video_fill.svg'

// 公告列表数据
const announcements = ref([])
const loading = ref(false)

// 表单相关
const dialogVisible = ref(false)
const formRef = ref(null)
const formLoading = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const fileList = ref([])
const videoFileList = ref([])
const tokenStore = useTokenStore()

// 计算上传请求头，添加token认证
const uploadHeaders = computed(() => {
  return {
    'Authorization': tokenStore.token ? `Bearer ${tokenStore.token}` : ''
  }
})

// 处理上传成功
const handleUploadSuccess = (response, file, fileList) => {
  if (response.code === 200) {
    ElMessage.success('图片上传成功')
    form.value.imageUrl = response.data
  } else {
    ElMessage.error(response.message || '上传失败')
    fileList.pop()
  }
}

// 处理上传错误
const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请稍后重试')
}

// 处理移除文件
const handleRemove = () => {
  form.value.imageUrl = ''
}

// 处理视频上传成功
const handleVideoUploadSuccess = (response, file, fileList) => {
  if (response.code === 200) {
    ElMessage.success('视频上传成功')
    form.value.videoUrl = response.data
  } else {
    ElMessage.error(response.message || '上传失败')
    fileList.pop()
  }
}

// 处理视频移除
const handleVideoRemove = () => {
  form.value.videoUrl = ''
}

// 表单数据
const form = ref({
  title: '',
  text: '',
  type: 'normal',
  status: 'active',
  imageUrl: '',
  videoUrl: ''
})
const rules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在2到50个字符之间', trigger: 'blur' }
  ],
  text: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度在5到500个字符之间', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 打开公告对话框
const openAnnouncementDialog = (editMode, announcement = null) => {
  isEdit.value = editMode;
  fileList.value = []
  videoFileList.value = []
  
  if (editMode && announcement) {
    form.value = { ...announcement };
    currentId.value = announcement.announcementId;
    
    // 如果有图片，添加到预览列表
    if (announcement.imageUrl) {
      fileList.value = [{
        name: '预览图片',
        url: announcement.imageUrl
      }]
    }
    
    // 如果有视频，添加到预览列表
    if (announcement.videoUrl) {
      videoFileList.value = [{
        name: '预览视频',
        url: announcement.videoUrl
      }]
    }
  } else {
    form.value = {
      title: '',
      text: '',
      type: 'normal',
      imageUrl: '',
      videoUrl: ''
    };
    currentId.value = null;
  }
  dialogVisible.value = true;
};

// 提交表单
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        formLoading.value = true;
        let result;
        
        if (isEdit.value) {
          // 调用更新API
          result = await updateAnnouncementService(currentId.value, form.value);
        } else {
          // 调用新增API
          result = await publishAnnouncementService(form.value);
        }
        
        if (result.code === 200) {
          if (isEdit.value) {
            const index = announcements.value.findIndex(item => item.announcementId === currentId.value);
            if (index !== -1) {
              announcements.value[index] = {
                ...form.value,
                announcementId: currentId.value,
                updateTime: new Date().toISOString()
              };
            }
            ElMessage.success('公告更新成功');
          } else {
            // 添加新发布的公告到列表
            const newAnnouncement = {
              ...form.value,
              announcementId: result.data?.announcementId || Date.now(),
              createTime: result.data?.createTime || new Date().toISOString(),
              updateTime: result.data?.updateTime || new Date().toISOString()
            };
            announcements.value.unshift(newAnnouncement);
            ElMessage.success('公告发布成功');
          }
          // 关闭弹窗
          dialogVisible.value = false;
        } else {
          ElMessage.error(result.message || '操作失败');
        }
      } catch (error) {
        console.error('提交公告失败:', error);
        ElMessage.error('操作失败，请稍后重试');
      } finally {
        formLoading.value = false;
      }
    }
  });
};

// 删除公告
const deleteAnnouncement = (id) => {
  // 检查ID是否有效
  if (!id || id === 'undefined' || typeof id === 'undefined') {
    console.error('尝试删除公告时ID无效:', id);
    ElMessage.error('公告ID无效，无法删除');
    return;
  }
  
  console.log('准备删除公告，ID:', id);
  
  ElMessageBox.confirm('确认删除该公告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true;
    try {
      const result = await deleteAnnouncementService(id);
      if (result.code === 200) {
        // 注意：这里要使用相同的属性名称进行过滤
        announcements.value = announcements.value.filter(item => item.announcementId !== id);
        ElMessage.success('公告删除成功');
      } else {
        ElMessage.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除公告失败:', error, '删除的ID:', id);
      ElMessage.error('删除失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {});
};

// 加载公告列表
const loadAnnouncements = async () => {
  loading.value = true;
  try {
    const result = await getAnnouncementListService();
    if (result.code === 200) {
      announcements.value = result.data || [];
    } else {
      ElMessage.error(result.message || '获取公告列表失败');
      announcements.value = [];
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    ElMessage.error('获取公告列表失败，请稍后重试');
    announcements.value = [];
  } finally {
    loading.value = false;
  }
};

// 添加视频预览方法
const previewVideo = (announcement) => {
  currentAnnouncement.value = announcement
  videoPreviewVisible.value = true
}

// 添加视频预览状态
const videoPreviewVisible = ref(false)
const currentAnnouncement = ref({})

// 添加视频播放状态管理
const activeVideos = reactive({})

// 添加切换视频显示方法
const toggleVideo = (id) => {
  // 停止所有其他视频播放
  Object.keys(activeVideos).forEach(key => {
    if (key !== id.toString() && activeVideos[key]) {
      activeVideos[key] = false
      const video = document.getElementById(`video-${key}`)
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  })
  
  // 切换当前视频状态
  activeVideos[id] = !activeVideos[id]
  
  // 如果激活了视频，就自动播放
  if (activeVideos[id]) {
    setTimeout(() => {
      const video = document.getElementById(`video-${id}`)
      if (video) {
        video.play().catch(e => {
          console.log('自动播放失败，需要用户交互', e)
        })
      }
    }, 100)
  }
}

// 初始化加载数据
onMounted(() => {
  loadAnnouncements();
});
</script>

<style scoped>
.announcement-manager {
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

.action-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.announcement-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(750px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.announcement-card {
  display: flex;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.announcement-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.announcement-media {
  width: 240px;
  height: 150px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
}

.media-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.announcement-card:hover .content-image {
  transform: scale(1.05);
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #000;
  color: white;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-thumbnail:hover {
  background-color: #111;
}

.video-thumbnail:hover .play-icon {
  transform: scale(1.1);
}

.play-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.view-video {
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
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

.announcement-card:hover .cover-actions {
  opacity: 1;
}

.preview-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(0.4) sepia(1) saturate(10) hue-rotate(300deg);
}

.announcement-info {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.announcement-title {
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

.top-action-btn {
  font-weight: bold;
  padding: 8px 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.top-action-btn.el-button--primary {
  background-color: #67c23a;
  border-color: #67c23a;
  color: white;
}

.top-action-btn.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.top-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.announcement-content {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.announcement-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.media-tag {
  display: inline-flex;
  align-items: center;
  background-color: #fb729915;
  color: #fb7299;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.media-tag::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #fb7299;
  margin-right: 4px;
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

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .announcement-card {
    flex-direction: column;
  }

  .announcement-media {
    width: 100%;
    height: 180px;
  }

  .announcement-info {
    padding: 12px;
  }
}

/* 添加相关样式 */
.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview.has-video:hover .video-indicator {
  opacity: 1;
}

.video-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.content-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

/* 为视频标签添加特殊样式 */
.media-tag.video-tag {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.media-tag.video-tag::before {
  background-color: #409eff;
}

/* 添加仅图片样式 */
.image-preview.image-only {
  cursor: default;
}
</style> 