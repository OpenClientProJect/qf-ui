<template>
  <div class="home-image-manager">
    <div class="section-header">
      <h2>首页图片管理</h2>
      <span class="section-subtitle">管理网站首页的背景图和轮播图</span>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="image-tabs">
      <el-tab-pane label="背景图管理" name="background">
        <div class="tab-content">
          <div class="background-image-section">
            <h3 class="subsection-title">当前背景图</h3>
            
            <!-- 有背景图时显示 -->
            <div class="current-image-container" v-if="currentBackgroundImage">
              <img :src="currentBackgroundImage" alt="当前背景图" class="preview-image">
              <div class="image-overlay">
                <el-button type="primary" @click="handleUpdateBackgroundClick">
                  <el-icon><Edit /></el-icon>
                  更换背景图
                </el-button>
              </div>
            </div>
            
            <!-- 没有背景图时显示添加按钮 -->
            <div class="empty-background" v-else>
              <el-empty description="暂无背景图">
                <el-button type="primary" @click="handleUpdateBackgroundClick">
                  <el-icon><Plus /></el-icon>
                  添加背景图
                </el-button>
              </el-empty>
            </div>
          </div>
          
          <!-- 上传新背景图 -->
          <el-dialog
            v-model="backgroundUploadVisible"
            :title="currentBackgroundImage ? '更换背景图' : '添加背景图'"
            width="500px"
          >
            <el-upload
              class="image-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              name="image"
              :show-file-list="false"
              :on-success="handleBackgroundSuccess"
              :before-upload="beforeImageUpload"
              :on-error="handleUploadError"
            >
              <img v-if="backgroundImageUrl" :src="backgroundImageUrl" class="upload-preview" />
              <el-icon v-else class="upload-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              * 推荐尺寸: 1920×300px，JPG或PNG格式，文件大小不超过20MB
            </div>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="backgroundUploadVisible = false">取消</el-button>
                <el-button 
                  type="primary" 
                  :disabled="!backgroundImageUrl" 
                  @click="confirmUpdateBackground"
                >
                  确认更换
                </el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="轮播图管理" name="carousel">
        <div class="tab-content">
          <div class="action-bar">
            <el-button type="primary" @click="handleAddCarouselClick">
              <el-icon><Plus /></el-icon> 添加轮播图
            </el-button>
          </div>
          
          <!-- 轮播图列表 -->
          <div class="carousel-list">
            <el-table :data="carouselItems" style="width: 100%" v-loading="loading">
              <el-table-column label="预览" width="180">
                <template #default="scope">
                  <img :src="scope.row.image" class="table-image" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column label="视频" width="100">
                <template #default="scope">
                  <el-tag v-if="scope.row.video" type="success">已设置</el-tag>
                  <el-tag v-else type="info">未设置</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button 
                    type="primary" 
                    link
                    @click="handleEditCarousel(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    link
                    @click="handleDeleteCarousel(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 添加/编辑轮播图对话框 -->
          <el-dialog
            v-model="carouselDialogVisible"
            :title="editingCarousel ? '编辑轮播图' : '添加轮播图'"
            width="600px"
          >
            <el-form :model="carouselForm" label-width="100px" ref="carouselFormRef">
              <el-form-item label="标题" prop="title" required>
                <el-input v-model="carouselForm.title" placeholder="请输入轮播图标题" />
              </el-form-item>
              <el-form-item label="描述" prop="description">
                <el-input 
                  v-model="carouselForm.description" 
                  type="textarea" 
                  rows="2"
                  placeholder="请输入轮播图描述文字"
                />
              </el-form-item>
              <el-form-item label="图片" prop="image" required>
                <el-input 
                  v-model="carouselForm.image" 
                  placeholder="请输入图片URL地址" 
                />
                <div class="upload-tip">
                  * 推荐尺寸: 960×480px，JPG或PNG格式
                </div>
              </el-form-item>
              <el-form-item label="视频地址" prop="video">
                <el-input v-model="carouselForm.video" placeholder="请输入视频URL地址（可选）" />
                <div class="upload-tip">
                  * 视频格式需为mp4，建议使用直链
                </div>
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="carouselDialogVisible = false">取消</el-button>
                <el-button 
                  type="primary" 
                  @click="submitCarouselForm"
                  :loading="submitting"
                >
                  确认
                </el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Upload, Picture } from '@element-plus/icons-vue'
import { useTokenStore } from '@/stores/token'
import {getBackgroundImageService, getHomeImageService, uploadHomeImageService, editHomeImageService, deleteHomeImageService, updateHomeImageService, addHomeImageService} from '@/api/admin/adminhomeimage'

// 创建状态变量
const activeTab = ref('background')
const loading = ref(false)
const submitting = ref(false)
const backgroundUploadVisible = ref(false)
const carouselDialogVisible = ref(false)
const backgroundImageUrl = ref('')
const editingCarousel = ref(null)

// 当前背景图
const currentBackgroundImage = ref()
// 背景图ID
const backgroundImageId = ref(null)

// Token相关
const tokenStore = useTokenStore()
const uploadHeaders = computed(() => {
  return {
    Authorization: tokenStore.token ? `Bearer ${tokenStore.token}` : ''
  }
})

// 上传接口地址
const uploadAction = '/api/file/uploadImage' // 修改为你的实际上传接口

// 轮播图列表
const carouselItems = ref([])

// 轮播图表单
const carouselForm = reactive({
  id: null,
  title: '',
  description: '',
  image: '',
  video: '',
  link: ''
})

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    // 获取轮播图数据
    const result = await getHomeImageService()
    if (result.code === 200) {
      // 适配API返回的轮播图数据格式
      carouselItems.value = result.data.map(item => ({
        id: item.homeImgId,
        title: item.title,
        description: item.description,
        image: item.image,
        video: item.video,
        createTime: item.createTime
      }))
    }
    
    // 获取背景图数据
    const bgResult = await getBackgroundImageService()
    if (bgResult.code === 200 && bgResult.data) {
      // 适配新的背景图数据格式
      currentBackgroundImage.value = bgResult.data.img
      backgroundImageUrl.value = bgResult.data.img
      backgroundImageId.value = bgResult.data.id
    }
    
    loading.value = false
  } catch (error) {
    console.error('获取首页图片失败:', error)
    loading.value = false
  }
}

// 上传图片前验证
const beforeImageUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isWebP = file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 20

  if (!isJPG && !isPNG && !isWebP) {
    ElMessage.error('上传图片只能是 JPG/PNG/WebP 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理背景图上传成功
const handleBackgroundSuccess = (response) => {
  if (response.code === 200 && response.data) {
    backgroundImageUrl.value = response.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败: ' + (response.message || '未知错误'))
  }
}

// 处理上传错误
const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请检查网络连接或稍后重试')
}

// 点击更新背景图
const handleUpdateBackgroundClick = () => {
  backgroundImageUrl.value = ''
  backgroundUploadVisible.value = true
}

// 确认更新背景图
const confirmUpdateBackground = async () => {
  if (!backgroundImageUrl.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  
  submitting.value = true
  try {
    let result;
    
    // 判断是添加还是更新背景图
    if (backgroundImageId.value) {
      // 更新背景图，传递id和img参数
      const updateData = {
        id: backgroundImageId.value,
        img: backgroundImageUrl.value
      }
      result = await updateHomeImageService(updateData)
    } else {
      // 添加背景图，只传递img参数
      const addData = {
        img: backgroundImageUrl.value
      }
      result = await addHomeImageService(addData)
    }
    
    if (result.code === 200) {
      currentBackgroundImage.value = backgroundImageUrl.value
      // 如果是添加操作，保存返回的ID
      if (!backgroundImageId.value && result.data && result.data.id) {
        backgroundImageId.value = result.data.id
      }
      ElMessage.success(backgroundImageId.value ? '背景图更新成功' : '背景图添加成功')
      backgroundUploadVisible.value = false
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('背景图操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 点击添加轮播图
const handleAddCarouselClick = () => {
  editingCarousel.value = null
  Object.keys(carouselForm).forEach(key => {
    carouselForm[key] = key === 'id' ? null : ''
  })
  carouselDialogVisible.value = true
}

// 编辑轮播图
const handleEditCarousel = (item) => {
  editingCarousel.value = item
  Object.keys(carouselForm).forEach(key => {
    carouselForm[key] = item[key]
  })
  carouselDialogVisible.value = true
}

// 删除轮播图
const handleDeleteCarousel = (item) => {
  ElMessageBox.confirm(
    `确认要删除轮播图 "${item.title}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      // 调用API删除轮播图
      const result = await deleteHomeImageService(item.id);
      
      if (result.code === 200) {
        // 删除成功后从列表中移除该项
        const index = carouselItems.value.findIndex(i => i.id === item.id);
        if (index !== -1) {
          carouselItems.value.splice(index, 1);
        }
        ElMessage.success('删除成功');
      } else {
        ElMessage.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除轮播图失败:', error);
      ElMessage.error('删除轮播图失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
}

// 提交轮播图表单
const submitCarouselForm = async () => {
  // 表单验证
  if (!carouselForm.title) {
    return ElMessage.warning('请输入轮播图标题')
  }
  if (!carouselForm.image) {
    return ElMessage.warning('请输入轮播图图片链接')
  }
  
  submitting.value = true
  try {
    // 准备请求数据
    const carouselData = {
      title: carouselForm.title,
      description: carouselForm.description,
      image: carouselForm.image,
      video: carouselForm.video
    };
    
    let result;
    
    // 如果是编辑模式，使用editHomeImageService更新轮播图
    if (editingCarousel.value) {
      carouselData.homeImgId = carouselForm.id;
      result = await editHomeImageService(carouselData);
    } else {
      // 新增轮播图使用uploadHomeImageService
      result = await uploadHomeImageService(carouselData);
    }
    
    if (result.code === 200) {
      // 保存成功后重新获取最新数据
      await initData();
      ElMessage.success(editingCarousel.value ? '轮播图更新成功' : '轮播图添加成功');
      carouselDialogVisible.value = false;
    } else {
      ElMessage.error(result.message || '保存轮播图失败');
    }
  } catch (error) {
    console.error('保存轮播图失败:', error);
    ElMessage.error('保存轮播图失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
}

// 组件挂载时获取数据
onMounted(() => {
  initData()
})
</script>

<style scoped>
.home-image-manager {
  padding: 10px 0;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  margin: 0 0 8px;
  color: #18191c;
}

.section-subtitle {
  font-size: 14px;
  color: #61666d;
}

.image-tabs {
  margin-top: 20px;
}

.tab-content {
  padding: 20px 0;
}

.subsection-title {
  font-size: 16px;
  margin: 0 0 16px;
  color: #18191c;
}

.current-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 24px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.current-image-container:hover .image-overlay {
  opacity: 1;
}

.image-uploader,
.carousel-image-uploader {
  width: 300px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader:hover,
.carousel-image-uploader:hover {
  border-color: #fb7299;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.action-bar {
  margin-bottom: 20px;
}

.carousel-list {
  margin-bottom: 20px;
}

.table-image {
  width: 120px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .carousel-list {
    width: 100%;
    overflow-x: auto;
  }
  
  .image-uploader,
  .carousel-image-uploader {
    width: 100%;
    max-width: 300px;
  }
}

.empty-background {
  padding: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 24px;
}
</style> 