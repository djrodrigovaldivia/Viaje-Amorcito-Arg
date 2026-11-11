export type MoodTag = '😍' | '🥰' | '✨' | '🏔️' | '☕' | '🍷' | '❄️' | '☀️' | '🌿' | '🍦';

export interface DiaryEntry {
  id: string;
  createdAt: number;
  date: string; // e.g. "2026-11-12"
  time: string; // e.g. "15:30"
  title: string;
  notes: string;
  photoUrl?: string; // base64 or blob URL of photo
  locationName: string; // e.g. "Obelisco, Buenos Aires"
  latitude?: number;
  longitude?: number;
  dayNumber?: number; // e.g. 1, 2, 3 (linked to itinerary day)
  dayScheduleId?: string; // id from DaySchedule
  landmarkId?: string; // linked to landmark if any
  mood: MoodTag;
  favorite: boolean;
}
