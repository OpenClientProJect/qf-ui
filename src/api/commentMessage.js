import request from "@/utils/request"

/**
 * 获取评论消息列表
 * 获取用户收到的评论和回复
 */
export const getCommentMessagesService = () => {
  return request.get('/comments/messages')
}

/**
 * 标记评论消息为已读
 * @param {number} commentId 评论ID
 */
export const markCommentReadService = (commentId) => {
  return request.put(`/comments/messages/read/${commentId}`)
}
