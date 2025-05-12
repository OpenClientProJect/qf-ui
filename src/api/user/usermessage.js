import request from "@/utils/request";

// 获取用户消息列表
export const getUserMessageListService = () => {
    return request.get("/user/message")
}