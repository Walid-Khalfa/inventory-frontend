
import axios from "axios";
import { getSession } from "next-auth/react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";

const axiosInternal = axios.create();

// Request interceptor — attach Authorization token
axiosInternal.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.jwt) {
    config.headers.Authorization = `Bearer ${session.jwt}`;
  }
  return config;
});

// Response interceptor — global error handling
axiosInternal.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = handleApiError(error);
    toast.error(errorMessage); // 🛎 show toast automatically
    return Promise.reject(error); // still reject so you can catch if needed
  }
);

export default axiosInternal;
