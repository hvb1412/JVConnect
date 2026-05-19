import axios from "axios";

export type BackendEvent = {
    _id: string;
    title: string;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    location: string;
    description?: string;
    detail?: string;
    imageURL?: string;
    status: string;
    organizer?: {
        _id: string;
        name: string;
        email: string;
        avatarURL?: string;
    };
    participants?: string[];
};

export type UiEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    description: string;
    organizer: string;
    participants: number;
    category: string;
    isJoined: boolean;
    eventDateRaw: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
};

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const FALLBACK_EVENT_IMAGE = "https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";


export const getEventById = async (id: string) => {
  const response = await api.get(`/events/${id}`);
  const event = response.data?.data;
  if (!event) return null;

  let currentUserId = localStorage.getItem("userId") || "";

  const participantsArr = Array.isArray(event.participants) ? event.participants : [];

  return {
    ...event,
    participants: participantsArr.length,
    isJoined: currentUserId ? participantsArr.includes(currentUserId) : false,
    maxParticipants: 20,
    date: new Date(event.eventDate).toLocaleDateString("ja-JP"),
    description: event.detail || event.description || "",
  };
};

export const joinEvent = async (id: string) => {
  const response = await api.post(`/events/${id}/join`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const cancelEvent = async (id: string) => {
  const response = await api.post(`/events/${id}/cancel`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const reportEvent = async (id: string, reason: string) => {
  const response = await api.post(`/events/${id}/report`, { reason }, {
    headers: getAuthHeader()
  });
  return response.data;
};
export function mapBackendEventToUi(event: BackendEvent): UiEvent {
    // Lấy YYYY年MM月DD日
    const d = new Date(event.eventDate);
    const dateStr = !isNaN(d.getTime()) ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : event.eventDate;
    
    let currentUserId = localStorage.getItem("userId") || "";

    const participantsArr = Array.isArray(event.participants) ? event.participants : [];
    
    return {
        id: event._id,
        title: event.title,
        date: dateStr,
        time: event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : (event.startTime || ""),
        location: event.location,
        image: event.imageURL?.trim() || FALLBACK_EVENT_IMAGE,
        description: event.detail || event.description || "",
        organizer: event.organizer?.name || "JV Connect",
        participants: participantsArr.length,
        category: "イベント", // Default category
        isJoined: currentUserId ? participantsArr.includes(currentUserId) : false,
        eventDateRaw: event.eventDate,
    };
}

export async function getAllEvents(): Promise<UiEvent[]> {
    try {
        const response = await api.get<ApiResponse<BackendEvent[]>>("/events", {
            headers: getAuthHeader(),
        });
        const events = Array.isArray(response.data?.data) ? response.data.data : [];
        return events.map(mapBackendEventToUi);
    } catch (error) {
        console.error("Failed to fetch events", error);
        return [];
    }
}

export async function getSuggestedEvents(): Promise<UiEvent[]> {
    try {
        const response = await api.get<ApiResponse<BackendEvent[]>>("/events/suggested", {
            headers: getAuthHeader(),
        });

        const events = Array.isArray(response.data?.data) ? response.data.data : [];
        return events.map(mapBackendEventToUi);
    } catch (error) {
        console.error("Failed to fetch suggested events", error);
        return [];
    }
}
