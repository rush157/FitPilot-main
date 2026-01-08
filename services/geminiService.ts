import { GoogleGenAI, Type, Modality } from '@google/genai';
import { UserProfile, ActivityData, FitnessPlan, Meal, Exercise } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      sets: { type: Type.INTEGER },
      reps: { type: Type.STRING, description: 'e.g., 8-12 reps or holds' },
      description: { type: Type.STRING, description: 'Brief instruction on how to perform the exercise.' },
      targetMuscle: { type: Type.STRING, description: 'The primary muscle group targeted.' },
      duration: { type: Type.INTEGER, description: 'Optional: Duration in seconds for timed exercises like planks or cardio. Omit for rep-based exercises.' },
      imageUrl: { type: Type.STRING, description: 'A comma-separated query string for an image search representing the exercise (e.g., "man,doing,pushups").' },
      youtubeVideoId: { type: Type.STRING, description: 'Optional: A relevant YouTube video ID for a short, clear instructional video of the exercise.' },
      youtubeStartTime: { type: Type.INTEGER, description: 'Optional: If a video is provided, the ideal start time in seconds to jump directly to the demonstration.' },
    },
    required: ['name', 'sets', 'reps', 'description', 'targetMuscle', 'imageUrl'],
};

const fitnessPlanSchema = {
  type: Type.OBJECT,
  properties: {
    workoutPlan: {
      type: Type.ARRAY,
      description: 'A 7-day workout plan.',
      items: {
        type: Type.OBJECT,
        properties: {
          dayOfWeek: { type: Type.STRING, description: 'e.g., Monday' },
          focus: { type: Type.STRING, description: 'e.g., Full Body Strength' },
          exercises: {
            type: Type.ARRAY,
            items: exerciseSchema,
          },
        },
        required: ['dayOfWeek', 'focus', 'exercises'],
      },
    },
    dietPlan: {
      type: Type.ARRAY,
      description: 'A 7-day diet plan.',
      items: {
        type: Type.OBJECT,
        properties: {
          dayOfWeek: { type: Type.STRING },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
                description: { type: Type.STRING, description: 'Detailed meal description.' },
                calories: { type: Type.INTEGER },
                macros: {
                    type: Type.OBJECT,
                    description: 'Macronutrient breakdown in grams.',
                    properties: {
                        protein: { type: Type.INTEGER, description: 'Grams of protein.' },
                        carbs: { type: Type.INTEGER, description: 'Grams of carbohydrates.' },
                        fat: { type: Type.INTEGER, description: 'Grams of fat.' },
                    },
                    required: ['protein', 'carbs', 'fat'],
                },
                imageUrl: { type: Type.STRING, description: 'A comma-separated query string for an image search representing the food (e.g., "grilled,chicken,salad").' }
              },
              required: ['name', 'description', 'calories', 'macros', 'imageUrl'],
            },
          },
          dailyCalorieTarget: { type: Type.INTEGER },
        },
        required: ['dayOfWeek', 'meals', 'dailyCalorieTarget'],
      },
    },
    generalAdvice: {
      type: Type.ARRAY,
      description: 'A list of 3-5 general wellness and motivation tips.',
      items: { type: Type.STRING },
    },
    motivationalQuote: {
        type: Type.STRING,
        description: 'An inspiring quote (5-15 words) to motivate the user for the day.'
    },
    dailyTip: {
        type: Type.STRING,
        description: 'A single, actionable fitness or wellness tip for the day.'
    }
  },
  required: ['workoutPlan', 'dietPlan', 'generalAdvice', 'motivationalQuote', 'dailyTip'],
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    // Hard stop if a rate limit error has already been detected in this session.
    if (sessionStorage.getItem('isApiLimitExceeded') === 'true') {
        throw new Error('API limit reached for this session. No further image generation requests will be made.');
    }

    try {
        const descriptivePrompt = `High-quality, professional fitness or food photography of: ${prompt}. Clean background, well-lit, realistic.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: descriptivePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error('Image generation succeeded but returned no images.');

    } catch (e: any) {
        console.warn(`Primary image generation failed for prompt "${prompt}":`, e.message);
        
        const isQuotaError = e.message && (e.message.includes('429') || /rate limit|quota/i.test(e.message));

        if (isQuotaError) {
            console.log(`Attempting fallback image generation for prompt "${prompt}" with gemini-2.5-flash-image.`);
            try {
                const descriptivePrompt = `A realistic, high-quality photo of: ${prompt}. Clean background, well-lit.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: descriptivePrompt }],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType;
                        return `data:${mimeType};base64,${base64ImageBytes}`;
                    }
                }
                throw new Error('Fallback image generation succeeded but returned no image data.');

            } catch (fallbackError) {
                console.error(`Fallback image generation also failed for prompt "${prompt}":`, fallbackError);
                throw e; // Re-throw the original error
            }
        }
        throw e; // If not a quota error, re-throw original error
    }
};

export const getFitnessPlan = async (userProfile: UserProfile, activityData: ActivityData): Promise<FitnessPlan> => {
  const goalMap = {
    'weight_loss': 'Weight Loss',
    'muscle_gain': 'Muscle Gain',
    'maintenance': 'Weight Maintenance',
    'endurance': 'Improve Endurance'
  };

  const prompt = `
    Act as an expert fitness and nutrition coach named "FitPilot".
    Generate a comprehensive, hyper-personalized, 7-day fitness and diet plan based on the detailed user profile below.
    Your response must be friendly, encouraging, and structured according to the JSON schema.

    **User Profile:**
    - Name: ${userProfile.name}
    - Age: ${userProfile.age}
    - Gender: ${userProfile.gender === 'prefer_not_to_say' ? 'Not specified' : userProfile.gender}
    - Weight: ${userProfile.weight} kg
    - Height: ${userProfile.height} cm
    - Medical Conditions/Irregularities: ${userProfile.medicalConditions || 'None specified'}

    **Lifestyle & Fitness:**
    - General Lifestyle: ${userProfile.lifestyle}
    - Work Style: ${userProfile.workStyle}
    - Workout Location: ${userProfile.workoutLocation}
    - Available Home Equipment: ${userProfile.homeEquipment || 'Bodyweight only'}
    - Current Fitness Level:
        - Max Push-ups: ${userProfile.pushupCount}
        - Max Plank Hold: ${userProfile.plankTime} seconds

    **Dietary Information:**
    - Weekly Food Budget: $${userProfile.foodBudget} (USD)
    - Allergies: ${userProfile.allergies || 'None'}
    - Dietary Restrictions: ${userProfile.dietaryRestrictions}

    **User Goals:**
    - Primary Goal: ${goalMap[userProfile.fitnessGoal]}
    - Detailed Goal Description: "${userProfile.detailedGoal}"
    - Daily Targets:
        - Steps: ${userProfile.dailyTargets.steps}
        - Active Calories: ${userProfile.dailyTargets.caloriesBurned} kcal
        - Exercise: ${userProfile.dailyTargets.exerciseMinutes} minutes
        - Water: ${userProfile.dailyTargets.waterIntake} liters
        - Sleep: ${userProfile.dailyTargets.sleepHours} hours

    **CRITICAL INSTRUCTIONS:**
    1.  **Workout Plan (7 days):**
        -   **Equipment Constraint:** If Workout Location is 'home', you MUST ONLY create exercises that are bodyweight or use the 'Available Home Equipment'. If 'gym', you can use standard gym equipment. Do not suggest exercises the user cannot perform.
        -   **Difficulty Scaling:** The plan MUST be tailored to the user's 'Current Fitness Level'. A user who can do ${userProfile.pushupCount} push-ups needs a more challenging plan than a beginner. The sets, reps, and exercise choice must reflect this.
        -   **Image & Video:** For 'imageUrl', provide a concise, comma-separated search query. The subject should be a 'man' for a male user, 'woman' for a female user, and 'person' otherwise. Provide a relevant 'youtubeVideoId' for a short instructional video. If you provide a video, also provide a 'youtubeStartTime' in seconds to jump to the exact moment the exercise demonstration begins.
    2.  **Diet Plan (7 days):**
        -   **Budget & Allergies:** The meal plan MUST be affordable within the specified 'Weekly Food Budget' and MUST NOT contain any of the user's 'Alleries'.
        -   **Restrictions:** The plan must strictly adhere to the user's 'Dietary Restrictions' (e.g., no meat for vegetarians).
        -   **Calorie Target:** The 'dailyCalorieTarget' for each day must align with the user's primary goal (e.g., a caloric deficit for weight loss, a surplus for muscle gain).
        -   **Image:** For 'imageUrl', provide a concise, comma-separated search query for the new meal.
    3.  **Holistic Approach:** The entire plan (workouts, diet, advice) should work together to help the user achieve BOTH their 'Primary Goal' and their 'Detailed Goal Description'. The general advice should be relevant and personalized.
    4.  **Schema Compliance:** The entire response MUST conform strictly to the provided JSON schema. Do not output any text outside the JSON structure.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: fitnessPlanSchema,
    },
  });

  try {
    const parsedPlan = JSON.parse(response.text) as FitnessPlan;
    return parsedPlan;
  } catch (e) {
    console.error("Failed to parse fitness plan JSON:", response.text, e);
    throw new Error("The AI response was not in the expected format. Please try again.");
  }
};

export const findYouTubeVideoForExercise = async (exercise: Exercise): Promise<{ youtubeVideoId: string; youtubeStartTime?: number }> => {
    const videoSchema = {
        type: Type.OBJECT,
        properties: {
            youtubeVideoId: { type: Type.STRING, description: 'The 11-character YouTube video ID.' },
            youtubeStartTime: { type: Type.INTEGER, description: 'The start time in seconds for the demonstration.' },
        },
        required: ['youtubeVideoId'],
    };

    const prompt = `
      Find the best possible YouTube video demonstrating the exercise "${exercise.name}".
      
      Description of exercise: "${exercise.description}"

      **Instructions:**
      1. Prioritize short, clear, high-quality videos from reputable fitness channels. Avoid long intros.
      2. Find the exact start time in seconds where the visual demonstration of the exercise begins.
      3. Return ONLY the 11-character YouTube video ID and the start time.
      4. Your response MUST strictly conform to the provided JSON schema. Do not add any extra text.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: videoSchema,
        },
    });
    
    try {
        const videoData = JSON.parse(response.text) as { youtubeVideoId: string; youtubeStartTime?: number };
        if (!videoData.youtubeVideoId) {
             throw new Error("AI did not return a valid YouTube video ID.");
        }
        return videoData;
    } catch (e) {
        console.error("Failed to parse video search JSON:", response.text, e);
        throw new Error("The AI response for video search was not in the expected format.");
    }
};

export const getExerciseSwap = async (userProfile: UserProfile, exerciseToSwap: Exercise, difficulty: 'easier' | 'harder'): Promise<Exercise> => {
    const prompt = `
      Act as a fitness coach. The user wants to swap an exercise for an ${difficulty} alternative.
      Provide a single alternative exercise.

      **User Profile:**
      - Gender: ${userProfile.gender === 'prefer_not_to_say' ? 'Not specified' : userProfile.gender}
      - Fitness Goal: ${userProfile.fitnessGoal}
      - Workout Location: ${userProfile.workoutLocation}
      - Available Equipment: ${userProfile.homeEquipment || 'Bodyweight only'}
      - Medical Conditions: ${userProfile.medicalConditions || 'None'}

      **Exercise to Swap:**
      - Name: ${exerciseToSwap.name}
      - Target Muscle: ${exerciseToSwap.targetMuscle}
      - Description: ${exerciseToSwap.description}

      **Instructions:**
      1. Generate one single, different exercise that is ${difficulty} than the one provided.
      2. The new exercise should ideally target the same primary muscle group and be performable with the user's available equipment.
      3. Provide all fields required by the JSON schema. Include 'duration' only if it's a timed exercise. For 'imageUrl', provide a concise, comma-separated search query. The image subject should match the user's gender ('man' for male, 'woman' for female). Use 'person' if gender is not specified. Include a 'youtubeVideoId' and 'youtubeStartTime' if you can find a suitable instructional video.
      4. The response MUST conform to the schema. Do not include any other text.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: exerciseSchema,
        },
    });

    try {
        const newExercise = JSON.parse(response.text) as Exercise;
        return newExercise;
    } catch (e) {
        console.error("Failed to parse exercise swap JSON:", e);
        throw new Error("The AI response was not in the expected format for an exercise swap.");
    }
};

export const getMealSwap = async (userProfile: UserProfile, mealToSwap: Meal): Promise<Meal> => {
    const mealSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
        description: { type: Type.STRING },
        calories: { type: Type.INTEGER },
        macros: {
          type: Type.OBJECT,
          properties: {
            protein: { type: Type.INTEGER },
            carbs: { type: Type.INTEGER },
            fat: { type: Type.INTEGER },
          },
          required: ['protein', 'carbs', 'fat'],
        },
        imageUrl: { type: Type.STRING, description: 'A comma-separated query string for an image search representing the food (e.g., "avocado,toast,egg").' }
      },
      required: ['name', 'description', 'calories', 'macros', 'imageUrl'],
    };
  
    const prompt = `
      Act as a nutrition coach. The user wants to swap a meal.
      Provide a single alternative for the following meal, keeping similar calorie and macro counts.
      
      **User Profile:**
      - Fitness Goal: ${userProfile.fitnessGoal}
      - Medical Conditions/Notes: ${userProfile.medicalConditions || 'None specified'}
      - Dietary Restrictions: ${userProfile.dietaryRestrictions}
      - Allergies: ${userProfile.allergies || 'None'}
  
      **Meal to Swap:**
      - Name: ${mealToSwap.name}
      - Description: ${mealToSwap.description}
      - Calories: ${mealToSwap.calories}
      - Macros: ${mealToSwap.macros.protein}g protein, ${mealToSwap.macros.carbs}g carbs, ${mealToSwap.macros.fat}g fat
  
      **Instructions:**
      - Generate a single, different meal suggestion that adheres to the user's dietary restrictions and allergies.
      - The new meal should be for the same time of day (e.g., if swapping Lunch, suggest a new Lunch).
      - Provide a concise, comma-separated 'imageUrl' search query for the new meal.
      - Match the calorie count as closely as possible.
      - The entire response MUST conform to the provided JSON schema. Do not include any other text.
    `;
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mealSchema,
      },
    });
  
    try {
      const parsedMeal = JSON.parse(response.text) as Meal;
      return parsedMeal;
    } catch (e) {
      console.error("Failed to parse meal swap JSON:", e);
      throw new Error("The AI response was not in the expected format for a meal swap.");
    }
  };