import request from "@/utils/request";

/**
 * 发布公告
 */
export const publishAnnouncementService = (data) =>{
    return request.post("/announcement",data);
}

/**
 * 获取公告列表
 */
export const getAnnouncementListService = () =>{
    return request.get("/announcement");
}

/**
 * 删除公告
 */
export const deleteAnnouncementService = (announcementId) =>{
    return request.delete(`/announcement?announcementId=` + announcementId);
}
