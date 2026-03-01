import { Comment, CommentCreate, CommentUpdate } from "../types";
import instance from "./axios";

// Отримати всі коментарі (з реплаями)
export const getComments = async (): Promise<Comment[]> => {
  const res = await instance.get<Comment[]>("/Comment");
  return res.data;
};

// Отримати коментар за ID (з реплаями)
export const getCommentById = async (id: number): Promise<Comment> => {
  const res = await instance.get<Comment>(`/Comment/${id}`);
  return res.data;
};

export const addComment = async (comment: CommentCreate): Promise<Comment> => {
  const res = await instance.post<Comment>("/Comment", comment);
  return res.data;
};

export const updateComment = async (id: number, comment: CommentUpdate): Promise<Comment> => {
  const res = await instance.put<Comment>(`/Comment/${id}`, comment);
  return res.data;
};

// Видалити коментар
export const deleteComment = async (id: number): Promise<void> => {
  await instance.delete(`/Comment/${id}`);
};