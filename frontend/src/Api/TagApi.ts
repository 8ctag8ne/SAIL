import instance from "./axios";
import { Tag, TagCreate, TagUpdate } from "../types";

// Отримати всі теги
export const getTags = async (): Promise<Tag[]> => {
    const res = await instance.get<Tag[]>(`/Tag`);
    return res.data;
};

// Отримати тег за ID
export const getTagById = async (id: number): Promise<Tag> => {
    const res = await instance.get<Tag>(`/Tag/${id}`);
    return res.data;
};

// Додати новий тег
export const addTag = async (tag: TagCreate): Promise<Tag> => {
    const formData = new FormData();
    formData.append("Title", tag.title);
    if (tag.info) formData.append("Info", tag.info);
    if (tag.image) formData.append("Image", tag.image);
    tag.bookIds.forEach(id => formData.append("BookIds", id.toString()));

    const res = await instance.post<Tag>(`/Tag`, formData);
    return res.data;
};

// Оновити тег
export const updateTag = async (id: number, tag: TagUpdate): Promise<Tag> => {
    const formData = new FormData();
    if (tag.title) formData.append("Title", tag.title);
    if (tag.info) formData.append("Info", tag.info);
    if (tag.image) formData.append("Image", tag.image);
    tag.bookIds.forEach(id => formData.append("BookIds", id.toString()));

    const res = await instance.put<Tag>(`/Tag/${id}`, formData);
    console.log(res.data);
    return res.data;
};

// Видалити тег
export const deleteTag = async (id: number): Promise<void> => {
    await instance.delete(`/Tag/${id}`);
};