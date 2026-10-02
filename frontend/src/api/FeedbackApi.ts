import axios from "./axios";

export interface FeedbackData {
  name: string;
  email: string;
  category: string;
  message: string;
}

export const sendFeedback = async (data: FeedbackData): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>("/feedback", data);
  return response.data;
};
