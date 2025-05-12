import request from "@/utils/request"

//获取视频列表接口
export const getVideoListService = (params) => {
    // 如果传入了分类参数，使用query方式传递
    if (params && params.categoryId !== undefined) {
        return request.get(`/video?categoryId=${params.categoryId}`)
    }
    // 默认获取所有视频
    return request.get('/video')
}
//获取视频详情接口
export const getVideoDetailService = (videoId) => {
    return request.get('/video/videoInfo?id='+videoId)
}
