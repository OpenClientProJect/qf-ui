import request from "@/utils/request";

/**
 * 获取草稿列表
 */
export const getVideoDraftListService = () => {
    return request({
        url: '/admin/video/getVideoList',
        method: 'get'
    })
}

export const AuditVideo = (id) =>{
    return request.post('/admin/video/auditVideo?id=' +id )
}