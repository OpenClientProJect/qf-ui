<!-- CategoryContent.vue -->
<template>
  <div class="category-content" v-if="categoryId !== 0">
    <div class="category-header">
      <h2>{{ categoryName }}</h2>
      <div class="category-stats">
        <span class="video-count">{{ videos.length }} 个视频</span>
      </div>
    </div>

    <!-- 视频网格 -->
    <div class="video-grid">
      <div v-for="(video, index) in videos" 
           :key="index" 
           class="video-card"
           @click="$emit('video-click', video)">
        <div class="video-thumbnail">
          <img :src="video.cover" :alt="video.title" class="cover-image">
        </div>
        <div class="video-title">{{ video.title }}</div>
        <div class="video-info">
          <div class="uploader">
            <span class="up-tag">
              <img src="../assets/iconsvg/up.svg" style="width: 20px" alt="">
            </span>
            <img :src="video.userPic || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
                 class="user-avatar">
            <span class="username">{{ video.nickname }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  categoryId: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  videos: {
    type: Array,
    default: () => []
  }
})

defineEmits(['video-click'])
</script>

<style scoped>
.category-content {
  margin-top: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.category-header h2 {
  font-size: 24px;
  color: #18191c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-stats {
  color: #666;
  font-size: 14px;
}

.video-count {
  background: #f4f5f7;
  padding: 4px 8px;
  border-radius: 4px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.video-card {
  overflow: hidden;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover .cover-image {
  transform: scale(1.05);
}

.video-title {
  padding: 12px;
  font-size: 14px;
  color: #18191c;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 40px;
}

.video-info {
  padding: 8px 12px;
  border-top: 1px solid #f4f5f7;
}

.uploader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

@media screen and (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 576px) {
  .video-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style> 