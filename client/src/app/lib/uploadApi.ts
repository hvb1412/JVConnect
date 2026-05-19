import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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
