import axios from "axios";
import { API_ENDPOINT } from "./config";

const api = axios.create({
  baseURL: API_ENDPOINT,
});

type UploadResponse = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
};

export async function uploadImageByUrl(url: string): Promise<UploadResponse> {
  const response = await api.post<UploadResponse>("/upload/url", { url });
  return response.data;
}
