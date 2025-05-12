<template>
  <div class="activity-manager">
    <div class="section-header">
      <h2>活动公告管理</h2>
      <span class="section-subtitle">管理网站的活动公告信息</span>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAddActivity">
        <el-icon><Plus /></el-icon> 发布活动公告
      </el-button>
    </div>
    
    <!-- 活动公告列表 -->
    <div class="activity-list">
      <el-table :data="activities" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="180"/>
        <el-table-column prop="text" label="内容" min-width="220" show-overflow-tooltip/>
        <el-table-column prop="createTime" label="创建时间" width="160"/>
        <el-table-column prop="type" label="活动类型" width="100">
          <template #default="scope">
            <el-tag :type="getActivityTypeTag(scope.row.type)">{{ getActivityTypeText(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="100">
          <template #default="scope">
            <el-image 
              v-if="scope.row.image" 
              :src="scope.row.image" 
              style="width: 60px; height: 40px; object-fit: cover;" 
              :preview-src-list="[scope.row.image]"
            />
            <el-tag v-else type="info">无图片</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              @click="handleEditActivity(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDeleteActivity(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加/编辑活动公告对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '发布活动公告' : '编辑活动公告'"
      width="600px"
    >
      <el-form :model="activityForm" label-width="100px" ref="activityFormRef" :rules="rules">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="activityForm.title" placeholder="请输入活动标题"/>
        </el-form-item>
        <el-form-item label="活动内容" prop="text">
          <el-input 
            v-model="activityForm.text" 
            type="textarea" 
            rows="5"
            placeholder="请输入活动详细内容"
          />
        </el-form-item>
        <el-form-item label="活动图片" prop="image">
          <el-input v-model="activityForm.image" placeholder="请输入活动图片链接(可选)" />
          <div class="upload-tip">
            * 建议尺寸: 800×450px，JPG或PNG格式
          </div>
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="activityForm.type" placeholder="请选择活动类型" style="width:100%">
            <el-option label="常规活动" value="regular" />
            <el-option label="限时活动" value="limited" />
            <el-option label="重要通知" value="important" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange" v-if="activityForm.type === 'limited'">
          <el-date-picker
            v-model="activityForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitActivityForm"
            :loading="submitting"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Calendar } from '@element-plus/icons-vue';
import { 
  getActivityListService, 
  createActivityService, 
  updateActivityService, 
  deleteActivityService,
  changeActivityStatusService
} from '@/api/admin/adminactivity';

// 活动列表数据
const activities = ref([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const total = ref(0);

// 表单引用
const activityFormRef = ref(null);

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  text: [
    { required: true, message: '请输入活动内容', trigger: 'blur' },
    { min: 10, max: 2000, message: '长度在10到2000个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  timeRange: [
    { required: true, message: '请选择活动时间范围', trigger: 'change' }
  ]
};

// 活动表单
const activityForm = reactive({
  activity_id: null,
  title: '',
  text: '',
  image: '',
  type: 'regular',
  timeRange: [],
  status: 'active'
});

// 获取活动类型标签颜色
const getActivityTypeTag = (type) => {
  const typeMap = {
    regular: '',
    limited: 'warning',
    important: 'danger'
  };
  return typeMap[type] || '';
};

// 获取活动类型文字
const getActivityTypeText = (type) => {
  const typeMap = {
    regular: '常规活动',
    limited: '限时活动',
    important: '重要通知'
  };
  return typeMap[type] || '未知类型';
};

// 初始化数据
const initData = async () => {
  loading.value = true;
  try {
    // 调用API获取活动列表
    const result = await getActivityListService();
    
    if (result.code === 200 && result.data) {
      // 适配后端返回的数据结构
      activities.value = result.data.map(item => ({
        activity_id: item.activityId, // 转换为前端使用的字段名
        title: item.title,
        text: item.text,
        image: item.image,
        createTime: item.createTime,
        // 以下字段用于前端展示，不是后端直接提供的
        type: item.type || 'regular',
        startTime: item.startTime || item.createTime,
        endTime: item.endTime || '',
        status: item.status || 'active'
      }));
      total.value = result.data.length;
    } else {
      // 处理API错误
      console.error('获取活动列表失败:', result.message);
    }
    loading.value = false;
  } catch (error) {
    console.error('获取活动列表失败:', error);
    ElMessage.error('获取活动列表失败，请稍后重试');
    loading.value = false;
  }
};

// 添加活动
const handleAddActivity = () => {
  dialogType.value = 'add';
  resetForm();
  dialogVisible.value = true;
};

// 编辑活动
const handleEditActivity = (row) => {
  dialogType.value = 'edit';
  resetForm();
  
  // 填充表单数据
  activityForm.activity_id = row.activity_id;
  activityForm.title = row.title;
  activityForm.text = row.text;
  activityForm.image = row.image || '';
  activityForm.type = row.type;
  activityForm.status = row.status;
  
  // 设置时间范围
  activityForm.timeRange = [
    new Date(row.startTime),
    new Date(row.endTime)
  ];
  
  dialogVisible.value = true;
};

// 删除活动
const handleDeleteActivity = (row) => {
  ElMessageBox.confirm(
    `确认要删除活动公告"${row.title}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true;
    try {
      // 调用API删除活动
      const result = await deleteActivityService(row.activity_id);
      
      if (result.code === 200) {
        // 删除成功后从列表中移除该项
        const index = activities.value.findIndex(item => item.activity_id === row.activity_id);
        if (index !== -1) {
          activities.value.splice(index, 1);
          total.value -= 1;
        }
        ElMessage.success('删除成功');
      } else {
        ElMessage.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      ElMessage.error('删除活动失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 提交活动表单
const submitActivityForm = async () => {
  if (!activityFormRef.value) return;
  
  await activityFormRef.value.validate(async (valid) => {
    if (!valid) {
      return ElMessage.warning('请完善表单信息');
    }
    
    submitting.value = true;
    try {
      // 准备后端需要的字段
      const activityData = {
        title: activityForm.title,
        text: activityForm.text,
        image: activityForm.image || ''
      };
      
      // 只在编辑时添加ID
      if (dialogType.value === 'edit') {
        activityData.activityId = activityForm.activity_id;
      }
      
      let result;
      
      if (dialogType.value === 'edit') {
        // 调用API更新活动
        result = await updateActivityService(activityData);
      } else {
        // 调用API创建新活动
        result = await createActivityService(activityData);
      }
      
      if (result.code === 200) {
        // 保存成功后重新获取最新数据
        await initData();
        ElMessage.success(dialogType.value === 'edit' ? '活动更新成功' : '活动添加成功');
        dialogVisible.value = false;
      } else {
        ElMessage.error(result.message || '保存活动失败');
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      ElMessage.error('保存活动失败，请稍后重试');
    } finally {
      submitting.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  if (activityFormRef.value) {
    activityFormRef.value.resetFields();
  }
  
  activityForm.activity_id = null;
  activityForm.title = '';
  activityForm.text = '';
  activityForm.image = '';
  activityForm.type = 'regular';
  activityForm.timeRange = [];
  activityForm.status = 'active';
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  initData();
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  initData();
};

// 组件挂载时获取数据
onMounted(() => {
  initData();
});
</script>

<style scoped>
.activity-manager {
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

.action-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.activity-list {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .activity-list {
    width: 100%;
    overflow-x: auto;
  }
}
</style> 