export type BodyPartId = 'chest' | 'back' | 'legs' | 'shoulders' | 'core';

export interface BodyPart {
  id: BodyPartId;
  name: string;
  color: string;
}

export interface Exercise {
  id: string;
  name: string;
  bodyPartId: BodyPartId;
}

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
}

export interface WorkoutLog {
  exerciseId: string;
  weight: number; // Represents the max weight or last weight for history
  date: number; // timestamp
}

export type ViewState = 'HOME' | 'EXERCISES' | 'SESSION' | 'SUCCESS';