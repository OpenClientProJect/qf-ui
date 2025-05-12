import request from "@/utils/request";

// 关注列表
export const getFollowListService = (userId) => {
  return request.get("/follow?userId=" + userId );
};
// 粉色列表
export const getFansListService = (userId) => {
  return request.get("/follow/fans?userId=" + userId );
};