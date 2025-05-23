import instance from "./axios";
import { Author, AuthorCreate, AuthorUpdate } from "../types";

// Отримати всіх авторів
export const getAuthors = async (): Promise<Author[]> => {
  const res = await instance.get<Author[]>(`/Author`);
  return res.data;
};

// Отримати автора за ID
export const getAuthorById = async (id: number): Promise<Author> => {
  const res = await instance.get<Author>(`/Author/${id}`);
  return res.data;
};

// Додати нового автора
export const addAuthor = async (author: AuthorCreate): Promise<Author> => {
  const formData = new FormData();
  formData.append("name", author.name);
  if (author.info) formData.append("info", author.info);
  if (author.image) formData.append("image", author.image);

  const res = await instance.post<Author>(`/Author`, formData);
  return res.data;
};

// Оновити дані автора
export const updateAuthor = async (id: number, author: AuthorUpdate): Promise<Author> => {
  const formData = new FormData();
  if (author.name) formData.append("name", author.name);
  if (author.info) formData.append("info", author.info);
  if (author.image) formData.append("image", author.image);

  const res = await instance.put<Author>(`/Author/${id}`, formData);
  return res.data;
};

// Видалити автора
export const deleteAuthor = async (id: number): Promise<void> => {
  await instance.delete(`/Author/${id}`);
};