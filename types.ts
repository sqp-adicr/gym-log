
// Add workout specific IDs to BodyPartId
export type BodyPartId = 'upper1' | 'lower1' | 'upper2' | 'lower2' | 'chest' | 'back' | 'legs' | 'shoulders' | 'core' | 'custom';

export interface BodyPart {
  id: BodyPartId;
  name: string;
  color: string;
}

export interface Exercise {
  id: string;
  name: string;
  bodyPartId: BodyPartId;
  suggestion?: {
    sets: string;
    reps: string;
    weight: string;
    rpe?: string;
    reasoning?: string;
  };
  warmupDetails?: Array<{
    action: string;
    reps: string | number;
    note?: string;
  }>;
}

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  rpe?: number;
  note?: string;
}

export interface WorkoutLog {
  exerciseId: string;
  weight: number; // Represents the max weight or last weight for history
  date: number; // timestamp
  bodyPartId?: string;
}

export type ViewState = 'HOME' | 'EXERCISES' | 'SESSION' | 'SUCCESS' | 'SUMMARY';

// AI Integration Types
export interface AIPlanDetails {
  summary: string;
  adjustments: string;
  feedbackRequired: string[];
  rawContent: string; // Stores the full unparsed response from LLM
}

export interface AIWorkoutPlan {
  summary: string;
  workout_plan: Array<{
    exercise: string;
    sets: string;
    reps: string;
    target_rpe: string;
    weight_suggestion: string;
    progression_reasoning: string;
  }>;
  fatigue_adjustments: string;
  post_workout_feedback_required: string[];
}