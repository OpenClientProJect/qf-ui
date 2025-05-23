<template>
  <div class="video-player" ref="playerContainer" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <div class="back-button" @click="router.back()" :class="{ 'show-control': isControlVisible }">
      <img :src="ReturnIcon" alt="返回"/>
    </div>
    <div class="artplayer-app"></div>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted, watch, nextTick} from 'vue'
import Artplayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import {useRouter} from 'vue-router'
import {sendBarrageService, getBarrageService} from '@/api/barrage'
import {ElMessage} from 'element-plus'
import ReturnIcon from '@/assets/iconsvg/coin.svg'

const props = defineProps({
  videoUrl: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  videoId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['toggle-collapse', 'play'])
const router = useRouter()
const art = ref(null)
const playerContainer = ref(null)

// 添加控制显示状态
const isControlVisible = ref(false)

// 鼠标移动处理
const handleMouseMove = () => {
  isControlVisible.value = true
}

// 鼠标离开处理
const handleMouseLeave = () => {
  isControlVisible.value = false
}

// 添加对网页全屏状态的管理
const isWebFullscreen = ref(false)

// 初始化播放器
const initPlayer = () => {
  if (art.value) return

  // 检查视频URL是否有效
  if (!props.videoUrl || !playerContainer.value) {
    console.error('视频URL无效或容器未就绪')
    return
  }

  // 确保容器内有 artplayer-app 元素
  const container = playerContainer.value.querySelector('.artplayer-app')
  if (!container) {
    console.error('找不到播放器容器元素')
    return
  }

  art.value = new Artplayer({
    container: container,
    url: props.videoUrl,
    poster: props.poster,
    title: props.title,
    volume: 0.5,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true,
    autoSize: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    loop: false,
    flip: true,
    rotate: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    theme: '#00a1d6',
    lang: 'zh-cn',
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
    controls: [
      {
        position: 'right',
        html: '画中画',
        click: function () {
          art.value.pip = !art.value.pip
        },
      },
      {
        position: 'right',
        html: `<div class="wide-screen-btn" title="宽屏模式">
          <svg class="wide-screen-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <path d="M824.448 199.552H199.552c-49.30133333 0-89.26933333 39.968-89.26933333 89.26933333v446.35733334c0 49.30133333 39.968 89.26933333 89.26933333 89.26933333h624.896c49.30133333 0 89.26933333-39.968 89.26933333-89.26933333V288.82133333c0-49.30133333-39.95733333-89.26933333-89.26933333-89.26933333zM338.98666667 521.32266667l45.90933333 45.90933333c13.07733333 13.06666667 13.07733333 34.272 0 47.33866667-13.07733333 13.07733333-34.272 13.07733333-47.33866667 0l-55.232-55.232-31.616-31.616c-8.68266667-8.68266667-8.68266667-22.76266667 0-31.44533334l31.616-31.616 55.232-55.232c13.07733333-13.06666667 34.272-13.06666667 47.33866667 0 13.07733333 13.07733333 13.07733333 34.272 0 47.33866667l-45.90933333 45.90933333c-5.152 5.152-5.152 13.49333333 0 18.64533334z m417.45066666 6.4l-31.62666666 31.616-55.232 55.232c-13.07733333 13.07733333-34.272 13.07733333-47.33866667 0-13.06666667-13.06666667-13.06666667-34.272 0-47.33866667l45.90933333-45.90933333c5.14133333-5.152 5.14133333-13.49333333 0-18.64533334l-45.90933333-45.90933333c-13.06666667-13.07733333-13.06666667-34.272 0-47.33866667 13.07733333-13.06666667 34.272-13.06666667 47.33866667 0l55.232 55.232 31.62666666 31.616c8.68266667 8.68266667 8.68266667 22.76266667 0 31.44533334z" />
          </svg>
        </div>`,
        tooltip: '宽屏模式',
        click: function () {
          emit('toggle-collapse', !props.isCollapsed)
        },
      },
    ],
    settings: [
      {
        width: 200,
        html: '画质',
        selector: [
          {
            html: '自动',
            default: true,
            url: props.videoUrl
          }
        ],
      },
    ],
    icons: {
      state: `<img src="https://s1.hdslb.com/bfs/static/player/img/play.svg" class="art-state-icon" alt="加载中。。。">`,
    },
    quality: [
      {
        default: true,
        html: '自动',
        url: props.videoUrl
      }
    ],
    thumbnails: {
      url: props.poster,
      number: 60,
      column: 10,
    },
    plugins: [
      artplayerPluginDanmuku({
        // 获取弹幕数据
        danmuku: async () => {
          try {
            const response = await getBarrageService(props.videoId)
            if (response.code === 200) {
              return response.data.map(item => ({
                text: item.text,
                time: item.time,
                color: item.color || '#FFFFFF',
                type: item.type || 0,
                border: false,
              }))
            }
            return []
          } catch (error) {
            console.error('获取弹幕失败:', error)
            ElMessage.error('获取弹幕失败')
            return []
          }
        },
        speed: 5,
        opacity: 1,
        fontSize: 25,
        color: '#FFFFFF',
        mode: 0,
        margin: [10, '25%'],
        antiOverlap: true,
        useWorker: true,
        synchronousPlayback: false,
        maxLength: 100,
        minWidth: 200,
        maxWidth: 400,
        theme: 'dark',
        // 输入框获得焦点时暂停视频
        onInput: () => {
          if (art.value && !art.value.paused) {
            art.value.pause()
          }
        },
        // 发送弹幕后恢复播放
        onSend: () => {
          if (art.value && art.value.paused) {
            art.value.play()
          }
        },
        // 发送弹幕前的处理
        beforeEmit: async (danmu) => {
          const barrageData = {
            videoId: props.videoId,
            text: danmu.text,
            time: art.value.currentTime,
            color: danmu.color,
            type: danmu.type
          }
          const response = await sendBarrageService(barrageData)
          if (response.code === 200) {
            ElMessage.success('发送弹幕成功')
            // 发送成功后立即将新弹幕添加到播放器
            return true
          }
          ElMessage.error(response.message || '发送弹幕失败')
          return false
        }
      })
    ]
  })

  // 监听播放器事件
  art.value.on('ready', () => {
    console.log('视频播放器已就绪')
  })

  art.value.on('play', () => {
    console.log('视频开始播放')
    handlePlay()
  })

  art.value.on('pause', () => {
    console.log('视频暂停')
  })

  // 错误处理
  art.value.on('error', (error) => {
    console.error('视频播放错误:', error)
    ElMessage.error('视频加载失败，请稍后重试')
  })

  // 监听全屏事件
  art.value.on('fullscreen', (state) => {
    emit('toggle-collapse', state)
  })

  // 监听网页全屏事件
  art.value.on('fullscreenWeb', (state) => {
    isWebFullscreen.value = state
    // 控制body滚动
    document.body.style.overflow = state ? 'hidden' : ''
    emit('toggle-collapse', state)
  })

  // 监听弹幕相关事件
  art.value.on('artplayerPluginDanmuku:emit', (danmu) => {
    console.log('发送弹幕:', danmu)
  })

  art.value.on('artplayerPluginDanmuku:loaded', (danmus) => {
    console.log('弹幕加载完成, 总数:', danmus.length)
  })

  art.value.on('artplayerPluginDanmuku:error', (error) => {
    console.error('弹幕错误:', error)
    ElMessage.error('弹幕系统出现错误')
  })
}

// 监听 URL 变化
watch(() => props.videoUrl, (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    if (art.value) {
      // 如果播放器已存在，更新视频源
      art.value.url = newUrl
      art.value.poster = props.poster
      art.value.title = props.title
    } else {
      // 如果播放器不存在，初始化播放器
      initPlayer()
    }
  }
}, {immediate: true})

// 组件挂载时初始化播放器
onMounted(() => {
  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    if (props.videoUrl) {
      initPlayer()
    }
  })
})

// 组件卸载时销毁播放器
onUnmounted(() => {
  if (art.value && art.value.destroy) {
    art.value.destroy()
    art.value = null
    document.body.style.overflow = ''
  }
})

// 处理视频播放事件
const handlePlay = () => {
  // 触发播放事件，通知父组件记录播放
  emit('play', props.videoId)
}
</script>

<style scoped>
.video-player {
  width: 100%;
  background: #000;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 16/9;
  max-width: 100%;
  margin: 0 auto;
}

.artplayer-app {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:deep(.art-video-player) {
  width: 100% !important;
  height: 100% !important;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, sans-serif;
  --theme: #00a1d6 !important; /* 设置主题色为蓝色 */
}

:deep(.art-subtitle) {
  bottom: 10px;
  font-size: 16px;
  text-shadow: 0.5px 0.5px 0.5px rgba(0, 0, 0, 0.5);
}

/* 自定义主题色 */
:deep(.art-video-player .art-control-progress) {
  /* 未播放部分使用半透明灰色 */
  background: rgba(255, 255, 255, 0.2);
}

:deep(.art-video-player .art-control-progress-inner) {
  /* 已播放部分使用蓝色 */
  background: #00a1d6;
}

:deep(.art-video-player .art-control-progress-inner .art-control-progress-dot) {
  /* 进度条小圆点使用蓝色边框 */
  border-color: #00a1d6;
}

:deep(.art-video-player .art-control-progress:hover .art-control-progress-inner) {
  height: 5px;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .video-player {
    border-radius: 2px;
  }
}

@media screen and (max-width: 768px) {
  .video-player {
    border-radius: 0;
  }

  :deep(.art-subtitle) {
    font-size: 14px;
  }
}

/* 自定义播放状态图标样式 */
:deep(.art-video-player .art-state) {
  position: absolute;
  right: 30px; /* 距离右边距离 */
  bottom: 70px; /* 距离底部距离，避免与控制栏重叠 */
  left: auto; /* 取消默认的左侧定位 */
  top: auto; /* 取消默认的顶部定位 */
  transform: none; /* 取消默认的居中变换 */
  background: none;
  padding: 0; /* 移除内边距 */
}

:deep(.art-state-icon) {
  width: 80px; /* 增加图标尺寸 */
  height: 80px; /* 增加图标尺寸 */
  filter: brightness(0) invert(1); /* 将图标转为白色 */
  opacity: 0.9;
  transition: all 0.3s ease;
}

:deep(.art-state:hover .art-state-icon) {
  opacity: 1;
  transform: scale(1.1);
}

/* 确保图标在暗色背景下可见 */
:deep(.art-state-playing) {
  display: none !important; /* 播放时隐藏图标 */
}

/* 宽屏按钮样式 */
:deep(.wide-screen-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 8px;
  transition: all 0.2s;
}

:deep(.wide-screen-icon) {
  width: 28px;
  height: 28px;
  fill: currentColor;
  transition: all 0.2s;
}

:deep(.wide-screen-btn:hover) {
  opacity: 0.85;
}

:deep(.wide-screen-btn:hover .wide-screen-icon) {
  transform: scale(1.1);
}

/* 调整控制栏右侧按钮间距 */
:deep(.art-control-right) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}

/* 控制栏按钮统一样式 */
:deep(.art-control-right .art-control) {
  opacity: 0.9;
  transition: all 0.2s;
  padding: 0 8px;
  cursor: pointer;
  font-size: 13px;
}

:deep(.art-control-right .art-control:hover) {
  opacity: 1;
}

/* 添加 loading 图标样式 */
:deep(.loading-icon) {
  animation: rotate 2s linear infinite;
  opacity: 0.8;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 确保 loading 图标在暗色背景下可见 */
:deep(.art-video-player .art-loading) {
  background: none;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease;
  opacity: 0;
  visibility: hidden;
}

.back-button.show-control {
  opacity: 1;
  visibility: visible;
}

.back-button:hover {
  transform: translateX(-2px);
}

.back-button img {
  width: 32px;
  height: 32px;
  filter: invert(80%);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.back-button:hover img {
  filter: invert(100%);
  opacity: 1;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .back-button {
    top: 12px;
    left: 12px;
  }

  .back-button img {
    width: 28px;
    height: 28px;
  }
}

/* 网页全屏时的样式 */
:deep(.art-video-player.art-fullscreen-web) {
  position: fixed !important;
  z-index: 9999;
  width: 100% !important;
  height: 100% !important;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #000;
}

/* 网页全屏时的返回按钮位置调整 */
:deep(.art-fullscreen-web) .back-button {
  top: 24px;
  left: 24px;
  z-index: 10000;
}

/* 网页全屏时的控制栏位置调整 */
:deep(.art-fullscreen-web .art-controls) {
  padding-bottom: 24px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  :deep(.art-fullscreen-web) .back-button {
    top: 16px;
    left: 16px;
  }

  :deep(.art-fullscreen-web .art-controls) {
    padding-bottom: 16px;
  }
}
</style>