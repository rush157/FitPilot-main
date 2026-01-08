import { UserProfile, FitnessPlan, WorkoutSessionState } from './types';

// Example User Profile 1: Beginner, Weight Loss, Home Workout
export const userProfileBeginner: UserProfile = {
  name: 'Alex',
  age: 28,
  weight: 85,
  height: 175,
  gender: 'male',
  fitnessGoal: 'weight_loss',
  medicalConditions: 'Slight knee discomfort on long runs',
  lifestyle: 'sedentary',
  workStyle: 'desk_job',
  workoutLocation: 'home',
  homeEquipment: 'Yoga mat, resistance bands',
  pushupCount: 5,
  plankTime: 30,
  foodBudget: 75,
  allergies: 'None',
  dietaryRestrictions: 'none',
  detailedGoal: 'I want to lose 10kg in 4 months and feel more energetic throughout the day.',
  dailyTargets: {
    steps: 8000,
    caloriesBurned: 400,
    exerciseMinutes: 20,
    waterIntake: 2.5,
    sleepHours: 7.5,
  },
};

// Example User Profile 2: Advanced, Muscle Gain, Gym
export const userProfileAdvanced: UserProfile = {
  name: 'Jordan',
  age: 32,
  weight: 75,
  height: 180,
  gender: 'female',
  fitnessGoal: 'muscle_gain',
  medicalConditions: 'None',
  lifestyle: 'very_active',
  workStyle: 'hybrid',
  workoutLocation: 'gym',
  homeEquipment: '',
  pushupCount: 40,
  plankTime: 180,
  foodBudget: 150,
  allergies: 'Peanuts',
  dietaryRestrictions: 'none',
  detailedGoal: 'Increase my main lift strength (squat, bench, deadlift) and add 3kg of lean muscle mass in the next 6 months.',
  dailyTargets: {
    steps: 12000,
    caloriesBurned: 800,
    exerciseMinutes: 60,
    waterIntake: 3.5,
    sleepHours: 8,
  },
};

// Example User Profile 3: Vegetarian, Maintenance, Home
export const userProfileVegetarian: UserProfile = {
  name: 'Casey',
  age: 45,
  weight: 60,
  height: 165,
  gender: 'prefer_not_to_say',
  fitnessGoal: 'maintenance',
  medicalConditions: 'None',
  lifestyle: 'moderately_active',
  workStyle: 'desk_job',
  workoutLocation: 'home',
  homeEquipment: 'Dumbbells (5kg, 10kg), Kettlebell (12kg), Pull-up bar',
  pushupCount: 20,
  plankTime: 90,
  foodBudget: 120,
  allergies: 'None',
  dietaryRestrictions: 'vegetarian',
  detailedGoal: 'Maintain my current fitness level, improve my core stability, and explore more vegetarian high-protein recipes.',
  dailyTargets: {
    steps: 10000,
    caloriesBurned: 500,
    exerciseMinutes: 45,
    waterIntake: 3,
    sleepHours: 7,
  },
};


// Example Mock Fitness Plan (can be used for testing UI rendering)
export const mockFitnessPlan: FitnessPlan = {
    workoutPlan: [
        {
            dayOfWeek: 'Monday',
            focus: 'Full Body Strength',
            exercises: [
                { name: 'Bodyweight Squats', sets: 3, reps: '12-15', description: '...', targetMuscle: 'Legs', imageUrl: 'person,doing,bodyweight,squat' },
                { name: 'Incline Push-ups', sets: 3, reps: '8-10', description: '...', targetMuscle: 'Chest', imageUrl: 'person,doing,incline,pushups' },
                { name: 'Plank', sets: 3, reps: 'Hold', duration: 45, description: '...', targetMuscle: 'Core', imageUrl: 'person,holding,plank' },
            ],
            isCompleted: false,
            completedExercisesCount: 0,
        },
        // ... more days
    ],
    dietPlan: [
        {
            dayOfWeek: 'Monday',
            dailyCalorieTarget: 2200,
            meals: [
                { name: 'Breakfast', description: 'Oatmeal with berries and nuts', calories: 400, macros: { protein: 15, carbs: 60, fat: 12 }, imageUrl: 'oatmeal,berries,nuts' },
                { name: 'Lunch', description: 'Grilled chicken salad with vinaigrette', calories: 600, macros: { protein: 40, carbs: 30, fat: 35 }, imageUrl: 'grilled,chicken,salad' },
                { name: 'Dinner', description: 'Salmon with quinoa and roasted vegetables', calories: 700, macros: { protein: 45, carbs: 50, fat: 35 }, imageUrl: 'salmon,quinoa,vegetables' },
                { name: 'Snack', description: 'Greek yogurt with honey', calories: 200, macros: { protein: 20, carbs: 25, fat: 2 }, imageUrl: 'greek,yogurt,honey' },
            ]
        },
        // ... more days
    ],
    generalAdvice: [
        "Stay hydrated by drinking water throughout the day.",
        "Aim for 7-9 hours of quality sleep each night.",
        "Listen to your body and take rest days when needed."
    ],
    motivationalQuote: "The only bad workout is the one that didn't happen.",
    dailyTip: "Try to incorporate a 10-minute walk after your largest meal to aid digestion."
};


// Example Mock Workout Session State
export const mockWorkoutSession: WorkoutSessionState = {
    dayPlan: mockFitnessPlan.workoutPlan[0],
    currentExerciseIndex: 1,
    currentSet: 2,
    timer: 0,
    status: 'pre-start',
};
