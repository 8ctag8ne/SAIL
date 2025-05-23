import axios from "axios";
import { AuthResponse } from "../types";

const API = "http://localhost:5102/api/account";

export const login = async (data: {
  id: string;
  userName: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await axios.post<AuthResponse>(`${API}/login`, data);
  return res.data;
};

export const register = async (data: {
  userName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await axios.post<AuthResponse>(`${API}/register`, data);
  return res.data;
};

// Отримати профіль поточного користувача
export const getProfile = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Отримати користувача за id
export const getUserById = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
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
  const res = await axios.put(`${API}/edit/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Видалити користувача (тільки власний або якщо Admin)
export const deleteUser = async (id: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API}/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Отримати всіх користувачів (тільки для Admin)
export const getAllUsers = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Змінити роль користувача (тільки для Admin)
export const setUserRole = async (userId: string, newRole: string) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(`${API}/set-role`, { userId, newRole }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};