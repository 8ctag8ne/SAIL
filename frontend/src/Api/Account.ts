import axios from "axios";
import { AuthResponse } from "../types";
import BASE_URL from "../config";

export const login = async (data: {
  id: string;
  userName: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await axios.post<AuthResponse>(`${BASE_URL}/api/account/login`, data);
  return res.data;
};

export const register = async (data: {
  userName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await axios.post<AuthResponse>(`${BASE_URL}/api/account/register`, data);
  return res.data;
};

// Отримати профіль поточного користувача
export const getProfile = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${BASE_URL}/api/account/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Отримати користувача за id
export const getUserById = async (id: string) => {
  const token = localStorage.getItem("token");
  console.trace(`🔥 getUserById called.\n Id: ${id}\n`);
  const res = await axios.get(`${BASE_URL}/api/account/${id}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  return res.data;
};

// Оновити користувача (тільки власний або якщо Admin)
export const editUser = async (id: string, data: {
  userName?: string;
  email?: string;
  about?: string;
  phoneNumber?: string;
}) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${BASE_URL}/api/account/edit/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Видалити користувача (тільки власний або якщо Admin)
export const deleteUser = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${BASE_URL}/api/account/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Отримати всіх користувачів (тільки для Admin)
export const getAllUsers = async () => {
  console.trace("🔥 getAllUsers called");
  const token = localStorage.getItem("token");
  const res = await axios.get(`${BASE_URL}/api/account/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Змінити роль користувача (тільки для Admin)
export const setUserRole = async (userId: string, newRole: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${BASE_URL}/api/account/set-role`, { userId, newRole }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};