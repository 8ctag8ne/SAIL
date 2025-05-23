import instance from "./axios";
import { BookList, SimpleBook } from "../types";

// DTOs для створення та оновлення списку книг
export type BookListCreate = {
  title: string;
  description?: string;
  isPrivate?: boolean;
  bookIds: number[];
};

export type BookListUpdate = {
  title: string;
  description?: string;
  isPrivate?: boolean;
  bookIds: number[];
};

// Отримати всі списки книг (тільки для Admin)
export const getBookLists = async (): Promise<BookList[]> => {
  const res = await instance.get<BookList[]>("/BookList");
  return res.data;
};

// Отримати всі списки книг для користувача
export const getBookListsForUser = async (userId: string): Promise<BookList[]> => {
  const res = await instance.get<BookList[]>(`/BookList/get-booklists/${userId}`);
  return res.data;
};

// Отримати список книг за id
export const getBookListById = async (id: number): Promise<BookList> => {
  const res = await instance.get<BookList>(`/BookList/${id}`);
  return res.data;
};

// Створити новий список книг
export const addBookList = async (data: BookListCreate): Promise<BookList> => {
  const res = await instance.post<BookList>("/BookList", data);
  return res.data;
};

// Оновити список книг
export const updateBookList = async (id: number, data: BookListUpdate): Promise<BookList> => {
  const res = await instance.put<BookList>(`/BookList/${id}`, data);
  return res.data;
};

// Видалити список книг
export const deleteBookList = async (id: number): Promise<void> => {
  await instance.delete(`/BookList/${id}`);
};

// Додати книгу до кількох списків
export const addBookToLists = async (bookId: number, bookListIds: number[]): Promise<void> => {
  await instance.post("/BookList/add-book", { bookId, bookListIds });
};

// Видалити книгу зі списку
export const removeBookFromList = async (bookId: number, listId: number): Promise<void> => {
  await instance.delete(`/BookList/remove-book`, { params: { bookId, listId } });
};