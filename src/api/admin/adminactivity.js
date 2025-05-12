import request from '@/utils/request'

// 获取活动公告列表
export function getActivityListService() {
  return request({
    url: '/admin/activity',
    method: 'get',
  })
}

// 获取活动公告详情
export function getActivityDetailService(id) {
  return request({
    url: `/admin/activity/${id}`,
    method: 'get'
  })
}

// 创建新活动公告
export function createActivityService(data) {
  return request({
    url: '/admin/activity',
    method: 'post',
    data
  })
}

// 更新活动公告
export function updateActivityService(data) {
  return request({
    url: '/admin/activity/update',
    method: 'put',
    data
  })
}

// 删除活动公告
export function deleteActivityService(id) {
  return request({
    url: `/admin/activity/delete/${id}`,
    method: 'delete'
  })
}

// 更改活动公告状态
export function changeActivityStatusService(id, status) {
  return request({
    url: '/admin/activity/status',
    method: 'put',
    data: { id, status }
  })
} 