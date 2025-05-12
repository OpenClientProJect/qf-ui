import request from "@/utils/request";

export const uploadHomeImageService = (data) => {
  return request.post("/admin/homeImage/upload", data);
};
//获取轮播图
export const getHomeImageService = () => {
  return request.get("/admin/homeImage/image");
};
//背景图
export const getBackgroundImageService = () => {
  return request.get("/admin/homeImage/background");
};

//编辑轮播图
export const editHomeImageService = (data) => {
  return request.put("/admin/homeImage", data);
};
//删除轮播图
export const deleteHomeImageService = (id) => {
  return request.delete(`/admin/homeImage/${id}`);
};
//更新轮播图
export const updateHomeImageService = (data) => {
  return request.put("/admin/homeImage/background", data);
};

//添加
export const addHomeImageService = (data) => {
  return request.post("/admin/homeImage/background", data);
};
