import request from "@/utils/request";

//用户点赞列表
export const getUserLikeService = (id) => {
    return request.get('/video/like?id=' + id)
}