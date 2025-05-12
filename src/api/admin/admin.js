import request from '@/utils/request'

/**
 * 获取视频审核列表
 */
export function getVideoReviewListService() {
  return request({
    url: '/admin/video/getVideoList',
    method: 'get',
  })
}

/**
 * 审核视频
 * @param {number} id - 视频ID
 * @param {boolean} review - 审核结果，true表示通过，false表示拒绝
 * @param {string} [reason] - 拒绝理由，当review为false时可以提供
 */
export function approveVideoService(id, review, reason) {
  return request({
    url: `/admin/video/auditVideo`,
    method: 'put',
    params: {
      id,
      review,
      reason
    }
  })
}