import React from 'react';
import { UserProfile, ActivityData, FitnessPlan } from '../types';
import { UserIcon, GoalIcon, SparklesIcon, LightbulbIcon } from './Icons';

interface DashboardProps {
  userProfile: UserProfile;
  activityData: ActivityData;
  fitnessPlan: FitnessPlan | null;
}

const ProgressCircle: React.FC<{
  percentage: number;
  color: string;
  label: string;
  value: string | number;
  goal: string | number;
  icon: React.ReactNode;
}> = ({ percentage, color, label, value, goal, icon }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-md text-center h-full">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="55"
            cx="60"
            cy="60"
          />
          <circle
            className={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="55"
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-700">
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold mt-3 text-gray-800">{label}</p>
      <p className="text-sm text-gray-500">{value} / {goal}</p>
    </div>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; content: string; color: string }> = ({ icon, title, content, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md h-full">
        <div className="flex items-center mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${color}`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 italic">"{content}"</p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ userProfile, activityData, fitnessPlan }) => {
    const goalMap = {
      'weight_loss': 'Weight Loss',
      'muscle_gain': 'Muscle Gain',
      'maintenance': 'Maintenance',
      'endurance': 'Improve Endurance'
    };

    const { dailyTargets } = userProfile;

    const stepsPercentage = Math.min(100, (activityData.steps / dailyTargets.steps) * 100);
    const caloriesPercentage = Math.min(100, (activityData.caloriesBurned / dailyTargets.caloriesBurned) * 100);
    const sleepPercentage = Math.min(100, (activityData.sleepHours / dailyTargets.sleepHours) * 100);
    const exercisePercentage = Math.min(100, (activityData.exerciseMinutes / dailyTargets.exerciseMinutes) * 100);
    const waterPercentage = Math.min(100, (activityData.waterIntake / dailyTargets.waterIntake) * 100);
    
    const today = new Date().toLocaleString('en-us', {  weekday: 'long' });
    const todaysWorkout = fitnessPlan?.workoutPlan.find(d => d.dayOfWeek === today);


    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Welcome, {userProfile.name}!</h2>
                    <div className="flex items-center text-gray-600 mt-1">
                        <GoalIcon className="w-5 h-5 mr-2" />
                        <span>Your Goal: <span className="font-semibold">{goalMap[userProfile.fitnessGoal]}</span></span>
                    </div>
                </div>
            </div>

            {todaysWorkout && (
                 <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Today's Focus: {todaysWorkout.focus}</h3>
                    <p className="text-gray-600">
                        {todaysWorkout.isCompleted ? "You've completed today's workout. Great job!" : "You've got this! Let's get moving."}
                    </p>
                </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-800 pt-4">Your Daily Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                 <ProgressCircle
                    percentage={stepsPercentage}
                    color="text-sky-500"
                    label="Steps"
                    value={activityData.steps.toLocaleString()}
                    goal={dailyTargets.steps.toLocaleString()}
                    icon={<i className="fas fa-shoe-prints"></i>}
                />
                <ProgressCircle
                    percentage={caloriesPercentage}
                    color="text-orange-500"
                    label="Calories Burned"
                    value={activityData.caloriesBurned.toLocaleString()}
                    goal={`${dailyTargets.caloriesBurned.toLocaleString()} kcal`}
                    icon={<i className="fas fa-fire"></i>}
                />
                 <ProgressCircle
                    percentage={exercisePercentage}
                    color="text-red-500"
                    label="Exercise"
                    value={`${activityData.exerciseMinutes} min`}
                    goal={`${dailyTargets.exerciseMinutes} min`}
                    icon={<i className="fas fa-dumbbell"></i>}
                />
                 <ProgressCircle
                    percentage={waterPercentage}
                    color="text-blue-500"
                    label="Water Intake"
                    value={`${activityData.waterIntake} L`}
                    goal={`${dailyTargets.waterIntake} L`}
                    icon={<i className="fas fa-tint"></i>}
                />
                <ProgressCircle
                    percentage={sleepPercentage}
                    color="text-purple-500"
                    label="Sleep"
                    value={`${activityData.sleepHours} hrs`}
                    goal={`${dailyTargets.sleepHours} hrs`}
                    icon={<i className="fas fa-moon"></i>}
                />
            </div>
            
            {fitnessPlan && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <InfoCard 
                        icon={<LightbulbIcon className="text-yellow-800"/>}
                        title="Tip of the Day"
                        content={fitnessPlan.dailyTip}
                        color="bg-yellow-100"
                    />
                     <InfoCard 
                        icon={<SparklesIcon className="text-pink-800"/>}
                        title="Motivation Boost"
                        content={fitnessPlan.motivationalQuote}
                        color="bg-pink-100"
                    />
                 </div>
            )}
        </div>
    );
};

export default Dashboard;