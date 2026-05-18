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

export function mapBackendEventToUi(event: BackendEvent): UiEvent {
    // Lấy YYYY年MM月DD日
    const d = new Date(event.eventDate);
    const dateStr = !isNaN(d.getTime()) ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : event.eventDate;
    
    return {
        id: event._id,
        title: event.title,
        date: dateStr,
        time: event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : (event.startTime || ""),
        location: event.location,
        image: event.imageURL?.trim() || FALLBACK_EVENT_IMAGE,
        description: event.detail || event.description || "",
        organizer: event.organizer?.name || "JV Connect",
    };
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
