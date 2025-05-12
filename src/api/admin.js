import request from '@/utils/request'

/**
 * 获取视频审核列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {number} params.status - 视频状态：1=待审核，2=已通过，3=已拒绝
 * @returns {Promise}
 */
export function getVideoReviewListService(params) {
  return request({
    url: '/admin/video/list',
    method: 'get',
    params
  })
}

/**
 * 审核通过视频
 * @param {number} id - 视频ID
 * @returns {Promise}
 */
export function approveVideoService(id) {
  return request({
    url: `/admin/video/approve/${id}`,
    method: 'put'
  })
}

/**
 * 拒绝视频
 * @param {Object} data - 拒绝数据
 * @param {number} data.id - 视频ID
 * @param {string} data.reason - 拒绝理由
 * @returns {Promise}
 */
export function rejectVideoService(data) {
  return request({
    url: `/admin/video/reject/${data.id}`,
    method: 'put',
    data: {
      reason: data.reason
    }
  })
} 