
export type Screen = 'login' | 'dashboard' | 'run' | 'summary' | 'history' | 'profile';

export type RunType = 'Free Run' | 'Interval' | 'Tempo' | 'Recovery' | 'Long Run';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  paceZoneId?: string;
}

export interface RunSession {
  id: string;
  type: string; 
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  distance: number; // in kilometers
  path: GeoPoint[];
  calories: number;
  avgPace: string; 
}

export interface ActiveSession {
    type: string;
    elapsedTime: number;
    distance: number;
    path: GeoPoint[];
    targetPace: number | null;
    selectedPresetName: string | null;
    isPaused: boolean;
}

export type Language = 'en' | 'id';

export type UnitSystem = 'metric' | 'imperial' | 'custom';

export interface PaceZone {
  id: string;
  name: string;
  minPace: number; // seconds per km
  maxPace: number; // seconds per km
  color: string;
}

export interface AudioCuesSettings {
    enabled: boolean;
    paceAlerts: boolean;
    distanceMilestones: boolean;
    alertFrequency: number; // In seconds
}

export interface WorkoutPreset {
  id: string;
  name: string;
  type: RunType;
  targetPace?: number;
}

export interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed?: number;
  humidity?: number;
  hourly?: {
      temperature_2m: number[];
      weathercode: number[];
  }
}
