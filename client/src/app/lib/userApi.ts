import axios from "axios";

export type BackendUser = {
  _id: string;
  name: string;
  email?: string;
  avatarURL?: string;
  area?: string;
  occupation?: string;
  introduction?: string;
  latestBanDate?: string | null;
};

export type UiUser = {
  id: string;
  name: string;
  role: string;
  location: string;
  industry: string;
  intro: string;
  avatar: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function mapBackendUserToUi(user: BackendUser): UiUser {
  const role = user.occupation?.trim() || "Chua cap nhat";
  const location = user.area?.trim() || "Chua cap nhat";
  const intro = user.introduction?.trim() || "Chua cap nhat thong tin";
  return {
    id: user._id,
    name: user.name,
    role,
    location,
    industry: role,
    intro,
    avatar: user.avatarURL?.trim() || FALLBACK_AVATAR,
  };
}

export async function searchUsers(params: {
  keyword?: string;
  area?: string;
  occupation?: string;
}): Promise<UiUser[]> {
  const response = await api.get<ApiResponse<BackendUser[]>>("/users/search", {
    params,
  });

  const users = Array.isArray(response.data?.data) ? response.data.data : [];
  return users.map(mapBackendUserToUi);
}

export async function getUserProfile(id: string): Promise<UiUser> {
  const token = localStorage.getItem("token");

  const response = await api.get<ApiResponse<BackendUser>>(
    `/users/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return mapBackendUserToUi(response.data.data);
}

