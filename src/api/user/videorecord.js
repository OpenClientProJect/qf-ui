import request from "@/utils/request";

/**
 * 添加视频播放记录
 */
export const addVideoRecordService = (videoId, categoryId) => {
  // 确保videoId和categoryId为数字类型，并包装为JSON格式数据
  return request({
    url: "/video/record",
    method: "post",
    data: { 
      videoId: Number(videoId),
      categoryId: Number(categoryId)
    }
  });
};

/**
 * 获取播放记录列表
 * @param {string} username - 用户名
 * @returns {Promise} - 返回Promise对象
 */
export const getVideoRecordListService = (username) => {
  return request({
    url: "/video/record",
    method: "get",
    params: { username }
  });
};