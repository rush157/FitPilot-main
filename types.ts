export interface DailyTargets {
  steps: number;
  caloriesBurned: number;
  exerciseMinutes: number;
  waterIntake: number; // in liters
  sleepHours: number;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  medicalConditions: string;
  
  // New Detailed Fields
  lifestyle: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  workStyle: 'desk_job' | 'physical_labor' | 'hybrid';
  workoutLocation: 'gym' | 'home';
  homeEquipment: string; // Comma-separated list
  
  // Fitness Level Indicators
  pushupCount: number;
  plankTime: number; // in seconds

  // Dietary Information
  foodBudget: number; // per week
  allergies: string;
  dietaryRestrictions: 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'pescetarian';

  // Detailed Goals
  detailedGoal: string; // User's own words
  dailyTargets: DailyTargets;
}

export interface ActivityData {
  steps: number;
  caloriesBurned: number;
  heartRate: number;
  sleepHours: number;
  exerciseMinutes: number;
  waterIntake: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  description: string;
  targetMuscle: string;
  imageUrl: string;
  duration?: number; // Optional: duration in seconds for timed exercises
  youtubeVideoId?: string; // Optional: YouTube video ID for exercise demo
  youtubeStartTime?: number; // Optional: Start time in seconds for the YouTube video
}

export interface WorkoutDay {
  dayOfWeek: string;
  focus: string;
  exercises: Exercise[];
  isCompleted?: boolean;
  completedExercisesCount?: number;
}

export interface Macros {
    protein: number;
    carbs: number;
    fat: number;
}

export interface Meal {
  name: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  description: string;
  calories: number;
  macros: Macros;
  imageUrl: string;
}

export interface DietDay {
  dayOfWeek: string;
  meals: Meal[];
  dailyCalorieTarget: number;
}

export interface FitnessPlan {
  workoutPlan: WorkoutDay[];
  dietPlan: DietDay[];
  generalAdvice: string[];
  motivationalQuote: string;
  dailyTip: string;
}

export interface WorkoutSessionState {
  dayPlan: WorkoutDay;
  currentExerciseIndex: number;
  currentSet: number;
  timer: number;
  status: 'pre-start' | 'working' | 'paused' | 'resting' | 'finished';
}