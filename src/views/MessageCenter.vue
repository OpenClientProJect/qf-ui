<template>
  <div class="message-center">
    <!-- 左侧菜单 -->
    <div class="message-sidebar">
      <el-menu
        :default-active="activeTab"
        class="message-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="likes">
          <template #title>
            <span>点赞消息</span>
          </template>
        </el-menu-item>
        <el-menu-item index="replies">
          <template #title>
            <span>聊天消息</span>
          </template>
        </el-menu-item>
        <el-menu-item index="comments">
          <template #title>
            <span>评论消息</span>
          </template>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容区 -->
    <div class="message-content-area">
      <div class="message-header">
        <h2>消息中心</h2>
      </div>

      <el-loading :visible="loading" fullscreen />
      <div class="message-list" v-if="currentMessages.length > 0">
        <div v-for="(message, index) in currentMessages" :key="index" class="message-item">
          <div class="message-avatar">
            <el-avatar :size="50" :src="message.avatar"></el-avatar>
          </div>
          <div class="message-content">
            <div class="message-info">
              <span class="message-username">{{ message.username }}</span>
              <span class="message-time">{{ message.time }}</span>
            </div>
            <!-- 聊天消息显示 -->
            <div v-if="message.isChat" class="message-text chat-message" @click="goToChat(message.chatUsername)" :class="{ 'clickable': message.isChat }">
              {{ message.content }}
            </div>

            <!-- 评论消息显示 -->
            <template v-else-if="message.isComment">
              <div class="message-text comment-message">
                <span class="comment-content">{{ message.content }}</span>
              </div>
              <div class="message-source" v-if="message.source" @click="message.videoId && goToVideo(message.videoId)">
                <el-card shadow="hover" class="message-source-card" :class="{ 'clickable': message.videoId }">
                  <div class="source-content-wrapper">
                    <div class="source-image" v-if="message.source.cover">
                      <img :src="message.source.cover" alt="视频封面" />
                    </div>
                    <div class="source-text">
                      <div class="source-title">{{ message.source.title }}</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </template>

            <!-- 点赞消息显示 -->
            <template v-else>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-source" v-if="message.source" @click="message.videoId && goToVideo(message.videoId)">
                <el-card shadow="hover" class="message-source-card" :class="{ 'clickable': message.videoId }">
                  <div class="source-content-wrapper">
                    <div class="source-image" v-if="message.source.cover">
                      <img :src="message.source.cover" alt="视频封面" />
                    </div>
                    <div class="source-text">
                      <div class="source-title">{{ message.source.title }}</div>
                      <div class="source-content" v-if="message.source.content">{{ message.source.content }}</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </template>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无消息"></el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTokenStore } from '@/stores/token'
import { useRouter } from 'vue-router'
import { getUserMessageListService } from '@/api/user/usermessage'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {formatDate} from "@/utils/format";

const router = useRouter()
const tokenStore = useTokenStore()
const activeTab = ref('likes') // 默认显示点赞消息标签页
const loading = ref(false) // 加载状态

// 检查用户是否登录
const isLogin = ref(!!tokenStore.token)
if (!isLogin.value) {
  // 如果未登录，重定向到首页
  router.push('/')
}

// 模拟数据 - 实际项目中应该从API获取
// 初始化消息数组

const likes = ref([])

const replies = ref([])

const comments = ref([])

// 根据当前选中的标签动态获取消息
const currentMessages = computed(() => {
  switch (activeTab.value) {
    case 'likes':
      return likes.value
    case 'comments':
      return comments.value
    case 'replies':
      return replies.value
    default:
      return []
  }
})

// 轮询定时器
const pollInterval = ref(null)

// 获取用户消息
const getUserMessages = async () => {
  if (!isLogin.value) return

  loading.value = true
  try {
    const res = await getUserMessageListService()
    if (res.code === 200 && res.data && res.data.length > 0) {
      const messageData = res.data[0] // 获取第一个数据对象

      // 处理点赞消息数据
      if (messageData.videoLike && messageData.videoLike.length > 0) {
        likes.value = messageData.videoLike.map(item => ({
          id: item.id,
          username: item.nickname,
          avatar: item.userPic,
          time: formatDate(item.likedAt),
          content: '赞了你的视频',
          videoId: item.videoId,
          source: {
            title: item.title,
            content: '',
            cover: item.cover
          }
        }))
      }

      // 处理聊天消息数据
      if (messageData.userChatMessageDto && messageData.userChatMessageDto.length > 0) {
        replies.value = messageData.userChatMessageDto.map(item => ({
          id: item.id,
          username: item.nickname,
          chatUsername: item.username, // 保存用户名以便跳转到聊天页面
          avatar: item.userPic,
          time: formatDate(item.sendTime),
          content: item.content,
          isChat: true
        }))
      }

      // 处理评论消息数据
      if (messageData.commentsMessage && messageData.commentsMessage.length > 0) {
        comments.value = messageData.commentsMessage.map(item => ({
          id: item.id,
          username: item.nickname,
          avatar: item.userPic,
          time: formatDate(item.createTime),
          content: item.content,
          videoId: item.videoId,
          source: {
            title: item.title,
            content: '',
            cover: item.videoCover
          },
          isComment: true
        }))
      }
    } else {
      ElMessage.error('获取消息失败：' + res.message)
    }
  } catch (error) {
    console.error('获取消息出错：', error)
    ElMessage.error('获取消息出错，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 开始轮询
const startPolling = () => {
  // 清除可能存在的定时器
  stopPolling()
  
  // 设置新的定时器，每5秒获取一次消息
  pollInterval.value = setInterval(() => {
    console.log('轮询获取消息...')
    getUserMessages()
  }, 3000)
}

// 停止轮询
const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

// 组件挂载时获取消息并开始轮询
onMounted(() => {
  if (isLogin.value) {
    getUserMessages().then(() => {
      // 初次获取消息成功后开始轮询
      startPolling()
    })
  }
})

// 组件卸载时清除轮询
onUnmounted(() => {
  stopPolling()
})

// 跳转到视频详情页
const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

// 跳转到聊天页面
const goToChat = (username) => {
  if (username) {
    // 如果有用户名，则传递给聊天页面
    router.push(`/chat?username=${encodeURIComponent(username)}`)
  } else {
    // 如果没有用户名，则直接跳转到聊天页面
    router.push('/chat')
  }
}

// 菜单切换事件
const handleMenuSelect = (key) => {
  activeTab.value = key
}
</script>

<style scoped>
.message-center {
  display: flex;
  max-width: 1200px;
  margin: 80px auto 40px;
  padding: 0 20px;
}

.message-sidebar {
  width: 200px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-right: 20px;
}

.message-menu {
  border-right: none;
}

.message-content-area {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.message-header {
  margin-bottom: 24px;
}

.message-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #18191c;
}

.message-list {
  padding: 20px 0;
}

.message-item {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f1f2f3;
}

.message-item:last-child {
  border-bottom: none;
}

.message-avatar {
  margin-right: 16px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-username {
  font-weight: bold;
  color: #18191c;
}

.message-time {
  color: #9499a0;
  font-size: 14px;
}

.message-text {
  margin-bottom: 12px;
  color: #18191c;
  line-height: 1.5;
}

.message-source {
  margin-top: 12px;
}

.message-source-card {
  background-color: #f6f7f8;
  border: none;
}

.source-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #18191c;
}

.source-content {
  color: #61666d;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.source-content-wrapper {
  display: flex;
  align-items: center;
}

.source-image {
  width: 120px;
  height: 70px;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px;
}

.source-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.source-text {
  flex: 1;
  overflow: hidden;
}

.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable:hover {
  background-color: #f0f1f2;
}

.chat-message {
  background-color: #f6f7f8;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 0;
  line-height: 1.6;
}

.comment-message {
  margin-bottom: 12px;
  line-height: 1.6;
}

.comment-content {
  background-color: #f6f7f8;
  padding: 8px 12px;
  border-radius: 4px;
  display: inline-block;
  color: #18191c;
}

.message-badge :deep(.el-badge__content) {
  background-color: #fb7299;
  border: none;
}

.system-message .message-username {
  color: #fb7299;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .message-center {
    flex-direction: column;
  }

  .message-sidebar {
    width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  }

  .message-content-area {
    width: 100%;
  }
}
</style>