import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ActivityData, FitnessPlan, WorkoutDay, Meal, WorkoutSessionState, Exercise } from './types';
import { getFitnessPlan as generateFitnessPlan, getMealSwap, getExerciseSwap } from './services/geminiService';
import UserProfileForm from './components/UserProfileForm';
import Dashboard from './components/Dashboard';
import Recommendations from './components/Recommendations';
import WorkoutSession from './components/WorkoutSession';
import { Nav, View } from './components/Nav';
import { Header } from './components/Header';
import Auth from './components/Auth';
import FormulatingPlan from './components/FormulatingPlan';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  
  // New plan state management
  const [proposedPlan, setProposedPlan] = useState<FitnessPlan | null>(null);
  const [acceptedPlan, setAcceptedPlan] = useState<FitnessPlan | null>(null);
  
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [workoutSessionState, setWorkoutSessionState] = useState<WorkoutSessionState | null>(null);

  useEffect(() => {
    // Check local storage for saved data to persist session
    const storedProfile = localStorage.getItem('userProfile');
    const storedPlan = localStorage.getItem('acceptedPlan');
    const storedWorkoutSession = localStorage.getItem('workoutSessionState');

    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        setUserProfile(parsedProfile);

        if (storedPlan) {
          const parsedPlan = JSON.parse(storedPlan);
           // Hydrate completed exercise counts if missing from older stored plans
          parsedPlan.workoutPlan = parsedPlan.workoutPlan.map((day: WorkoutDay) => ({
            ...day,
            completedExercisesCount: day.isCompleted ? day.exercises.length : (day.completedExercisesCount || 0),
          }));
          setAcceptedPlan(parsedPlan);
        }
        if (storedWorkoutSession) {
          setWorkoutSessionState(JSON.parse(storedWorkoutSession));
        }
        setIsLoggedIn(true);

        // Set initial activity data for the dashboard
        setActivityData({
            steps: 8500,
            caloriesBurned: 450,
            heartRate: 68,
            sleepHours: 6.5,
            exerciseMinutes: 25,
            waterIntake: 1.2
        });

      } catch (e) {
        console.error("Failed to parse data from local storage", e);
        localStorage.clear();
      }
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setAcceptedPlan(null);
    setProposedPlan(null);
    setWorkoutSessionState(null);
    setCurrentView(View.DASHBOARD);
    localStorage.clear();
  };

  const handleSaveProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, []);

  const handleGeneratePlan = async (profileData: UserProfile, activity: ActivityData) => {
    setIsLoading(true);
    setError(null);
    setAcceptedPlan(null); // Clear old accepted plan
    localStorage.removeItem('acceptedPlan');

    handleSaveProfile(profileData);
    setActivityData(activity);

    try {
      const plan = await generateFitnessPlan(profileData, activity);
      setProposedPlan(plan);
      setCurrentView(View.RECOMMENDATIONS);
    } catch (e: any) {
      console.error("Error generating fitness plan:", e);
      setError(e.message || "Failed to generate fitness plan. The AI model might be busy. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptPlan = (plan: FitnessPlan) => {
    const planWithCompletion = {
      ...plan,
      workoutPlan: plan.workoutPlan.map(day => ({...day, isCompleted: false, completedExercisesCount: 0 }))
    };
    setAcceptedPlan(planWithCompletion);
    localStorage.setItem('acceptedPlan', JSON.stringify(planWithCompletion));
    setProposedPlan(null);
    setCurrentView(View.RECOMMENDATIONS);
  };

  const handleStartWorkout = (dayPlan: WorkoutDay) => {
    const newSession: WorkoutSessionState = {
      dayPlan,
      currentExerciseIndex: 0,
      currentSet: 1,
      timer: dayPlan.exercises[0].duration || 0,
      status: 'pre-start',
    };
    setWorkoutSessionState(newSession);
    localStorage.setItem('workoutSessionState', JSON.stringify(newSession));
  };
  
  const handleUpdateWorkoutState = (newState: WorkoutSessionState | null) => {
      if (newState && acceptedPlan) {
        // Update the visual progress of the liquid bar as exercises are completed
        const dayIndex = acceptedPlan.workoutPlan.findIndex(d => d.dayOfWeek === newState.dayPlan.dayOfWeek);
        if (dayIndex > -1) {
            const currentDayState = acceptedPlan.workoutPlan[dayIndex];
            const completedCount = newState.currentExerciseIndex;
            
            // Only update state if progress has changed to avoid unnecessary re-renders
            if (completedCount !== (currentDayState.completedExercisesCount || 0)) {
                const updatedPlan = { ...acceptedPlan };
                updatedPlan.workoutPlan[dayIndex].completedExercisesCount = completedCount;
                setAcceptedPlan(updatedPlan);
                localStorage.setItem('acceptedPlan', JSON.stringify(updatedPlan));
            }
        }
      }
      setWorkoutSessionState(newState);
      if(newState) {
          localStorage.setItem('workoutSessionState', JSON.stringify(newState));
      } else {
          localStorage.removeItem('workoutSessionState');
      }
  };

  const handleEndWorkout = (completedDay: WorkoutDay) => {
    if (acceptedPlan) {
      const updatedPlan = {
        ...acceptedPlan,
        workoutPlan: acceptedPlan.workoutPlan.map(day => 
          day.dayOfWeek === completedDay.dayOfWeek 
          ? { ...day, isCompleted: true, completedExercisesCount: day.exercises.length } 
          : day
        )
      };
      setAcceptedPlan(updatedPlan);
      localStorage.setItem('acceptedPlan', JSON.stringify(updatedPlan));
    }
    handleUpdateWorkoutState(null);
  };

  const handleSwapMeal = async (dayIndex: number, mealIndex: number, mealToSwap: Meal): Promise<void> => {
    if (!userProfile || !proposedPlan) return;
    try {
      const newMeal = await getMealSwap(userProfile, mealToSwap);
      const updatedPlan = { ...proposedPlan };
      updatedPlan.dietPlan[dayIndex].meals[mealIndex] = newMeal;
      setProposedPlan(updatedPlan);
    } catch (e: any) {
      console.error("Error swapping meal:", e);
      throw e; // Re-throw the error for the component to handle
    }
  };
  
  const handleSwapExercise = async (dayIndex: number, exerciseIndex: number, exerciseToSwap: Exercise, difficulty: 'easier' | 'harder'): Promise<void> => {
    if (!userProfile || !proposedPlan) return;
    try {
        const newExercise = await getExerciseSwap(userProfile, exerciseToSwap, difficulty);
        const updatedPlan = { ...proposedPlan };
        updatedPlan.workoutPlan[dayIndex].exercises[exerciseIndex] = newExercise;
        setProposedPlan({ ...updatedPlan });
    } catch (e: any)
    {
        console.error("Error swapping exercise:", e);
        throw e; // Re-throw the error for the component to handle
    }
  };
  
  const handleLogoClick = () => {
    if(userProfile && acceptedPlan) {
      setCurrentView(View.DASHBOARD);
    }
  };

  const handleCancelProfileUpdate = () => {
    if (acceptedPlan) {
      setCurrentView(View.DASHBOARD);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <FormulatingPlan />;
    }

    if (!userProfile || !acceptedPlan) {
      if (proposedPlan) {
        // Show proposal acceptance screen if a plan is proposed but not yet accepted
        return <Recommendations 
          proposedPlan={proposedPlan}
          acceptedPlan={null}
          onAcceptPlan={handleAcceptPlan}
          onSwapMeal={handleSwapMeal}
          onSwapExercise={handleSwapExercise}
          error={error} 
        />
      }
      return (
        <div className="py-8">
          <UserProfileForm
            onGeneratePlan={handleGeneratePlan}
            existingProfile={userProfile}
            isPlanAccepted={!!acceptedPlan}
          />
        </div>
      );
    }

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard userProfile={userProfile} activityData={activityData || { steps: 0, caloriesBurned: 0, heartRate: 0, sleepHours: 0, exerciseMinutes: 0, waterIntake: 0 }} fitnessPlan={acceptedPlan} />;
      case View.RECOMMENDATIONS:
        return <Recommendations 
          proposedPlan={proposedPlan}
          acceptedPlan={acceptedPlan}
          onAcceptPlan={handleAcceptPlan}
          onStartWorkout={handleStartWorkout}
          onSwapMeal={handleSwapMeal}
          onSwapExercise={handleSwapExercise}
          error={error} 
        />;
      case View.PROFILE:
        return (
          <div className="py-8">
            <UserProfileForm
              onGeneratePlan={handleGeneratePlan}
              existingProfile={userProfile}
              isPlanAccepted={!!acceptedPlan}
              onCancel={handleCancelProfileUpdate}
            />
          </div>
        );
      default:
        return <Dashboard userProfile={userProfile} activityData={activityData || { steps: 0, caloriesBurned: 0, heartRate: 0, sleepHours: 0, exerciseMinutes: 0, waterIntake: 0 }} fitnessPlan={acceptedPlan} />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-lg font-semibold text-gray-700 animate-pulse">Loading FitPilot...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  if (workoutSessionState) {
    return <WorkoutSession 
              initialState={workoutSessionState} 
              onEndWorkout={handleEndWorkout} 
              onUpdateState={handleUpdateWorkoutState}
           />;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-gray-800">
      <Header 
        onLogoClick={handleLogoClick} 
        user={isLoggedIn} 
        onLogout={handleLogout}
        isPlanAccepted={!!acceptedPlan}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {renderContent()}
      </main>
      {userProfile && acceptedPlan && (
        <Nav currentView={currentView} setCurrentView={setCurrentView} />
      )}
    </div>
  );
};

export default App;