import axios, { AxiosError } from "axios";
import { BASE_API_URL } from "./env";

export type ApiError = AxiosError<{ message?: string; errorCode?: string }> & {
  errorCode?: string;
};

const API = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
  timeout: 10000,
});

API.interceptors.response.use(
  (response) => response,
  (error: ApiError) => {
    // Mutate rather than spread so the error keeps its prototype
    // (axios.isAxiosError and `instanceof Error` keep working).
    error.errorCode = error.response?.data?.errorCode ?? "UNKNOWN_ERROR";
    return Promise.reject(error);
  },
);

export default API;
