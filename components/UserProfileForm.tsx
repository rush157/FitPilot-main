import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityData, DailyTargets } from '../types';

interface UserProfileFormProps {
  onGeneratePlan: (profile: UserProfile, activity: ActivityData) => void;
  existingProfile: UserProfile | null;
  isPlanAccepted: boolean;
  onCancel?: () => void;
}

const InputField: React.FC<{ label: string; name: string; type: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: number; max?: number, step?: number, disabled?: boolean, required?: boolean }> = ({ label, name, type, value, onChange, min, max, step, disabled = false, required = true }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
        required={required}
      />
    </div>
);

const SelectField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; disabled: boolean; children: React.ReactNode }> = ({ label, name, value, onChange, disabled, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className="custom-select mt-1 block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
            {children}
        </select>
    </div>
);

const TextareaField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; disabled: boolean; placeholder: string; rows?: number, required?: boolean }> = ({ label, name, value, onChange, disabled, placeholder, rows=2, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea id={name} name={name} value={value} onChange={onChange} rows={rows} disabled={disabled} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder={placeholder} required={required}></textarea>
    </div>
);


const UserProfileForm: React.FC<UserProfileFormProps> = ({ onGeneratePlan, existingProfile, isPlanAccepted, onCancel }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 30,
    weight: 70,
    height: 175,
    gender: 'prefer_not_to_say',
    fitnessGoal: 'maintenance',
    medicalConditions: '',
    lifestyle: 'moderately_active',
    workStyle: 'desk_job',
    workoutLocation: 'gym',
    homeEquipment: '',
    pushupCount: 10,
    plankTime: 60,
    foodBudget: 100,
    allergies: '',
    dietaryRestrictions: 'none',
    detailedGoal: '',
    dailyTargets: {
        steps: 10000,
        caloriesBurned: 500,
        exerciseMinutes: 30,
        waterIntake: 2,
        sleepHours: 8,
    }
  });

  const [activity, setActivity] = useState<ActivityData>({
    steps: 10000,
    caloriesBurned: 500,
    heartRate: 65,
    sleepHours: 7,
    exerciseMinutes: 30,
    waterIntake: 1.5,
  });
  
  useEffect(() => {
    if (existingProfile) {
      setProfile(existingProfile);
    }
  }, [existingProfile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ['age', 'weight', 'height', 'pushupCount', 'plankTime', 'foodBudget'];
    setProfile(prev => ({ ...prev, [name]: numberFields.includes(name) ? Number(value) : value }));
  };

  const handleTargetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, dailyTargets: { ...prev.dailyTargets, [name]: Number(value) } }));
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({ ...prev, [name]: Number(value) }));
  };
  
  const handleGoogleFitSync = () => {
    alert("Simulating Google Fit Sync. Populating today's activity with sample data.");
    setActivity({
        steps: 12543,
        caloriesBurned: 620,
        heartRate: 62,
        sleepHours: 7.5,
        exerciseMinutes: 45,
        waterIntake: 2.1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePlan(profile, activity);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
        {isPlanAccepted ? 'Your Fitness Profile' : 'Create Your Fitness Profile'}
      </h2>
      <p className="text-center text-gray-500 mb-8">
        {isPlanAccepted ? 'To change your plan, update your details and regenerate.' : 'The more details you provide, the better your plan will be.'}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section: Personal Info */}
        <section className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Name" name="name" type="text" value={profile.name} onChange={handleProfileChange} />
                <InputField label="Age" name="age" type="number" value={profile.age} onChange={handleProfileChange} min={12} max={100} />
                <SelectField label="Gender" name="gender" value={profile.gender} onChange={handleProfileChange} disabled={false}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                </SelectField>
                <InputField label="Weight (kg)" name="weight" type="number" value={profile.weight} onChange={handleProfileChange} min={30} max={300} />
                <InputField label="Height (cm)" name="height" type="number" value={profile.height} onChange={handleProfileChange} min={100} max={250} />
                <div className="md:col-span-2">
                    <TextareaField label="Medical Conditions or Injuries (optional)" name="medicalConditions" value={profile.medicalConditions} onChange={handleProfileChange} disabled={false} placeholder="e.g., Knee pain, past shoulder injury" required={false} />
                </div>
            </div>
        </section>

        {/* Section: Lifestyle & Fitness */}
        <section className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Lifestyle & Fitness Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Daily Lifestyle" name="lifestyle" value={profile.lifestyle} onChange={handleProfileChange} disabled={false}>
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="lightly_active">Lightly Active (light exercise/sports 1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                    <option value="very_active">Very Active (hard exercise/sports 6-7 days a week)</option>
                </SelectField>
                 <SelectField label="Work Style" name="workStyle" value={profile.workStyle} onChange={handleProfileChange} disabled={false}>
                    <option value="desk_job">Desk Job (mostly sitting)</option>
                    <option value="hybrid">Hybrid (mix of sitting and moving)</option>
                    <option value="physical_labor">Physical Labor (mostly on your feet)</option>
                </SelectField>
                <SelectField label="Workout Location" name="workoutLocation" value={profile.workoutLocation} onChange={handleProfileChange} disabled={false}>
                    <option value="gym">Gym</option>
                    <option value="home">Home</option>
                </SelectField>
                 <TextareaField label="Available Home Equipment (if any)" name="homeEquipment" value={profile.homeEquipment} onChange={handleProfileChange} disabled={profile.workoutLocation !== 'home'} placeholder="e.g., Dumbbells (10kg), resistance bands, yoga mat" required={false} />
                <InputField label="Max Push-ups in one go" name="pushupCount" type="number" value={profile.pushupCount} onChange={handleProfileChange} min={0} />
                <InputField label="Max Plank Time (seconds)" name="plankTime" type="number" value={profile.plankTime} onChange={handleProfileChange} min={0} />
            </div>
        </section>

         {/* Section: Diet */}
        <section className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Dietary Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputField label="Weekly Food Budget ($ USD)" name="foodBudget" type="number" value={profile.foodBudget} onChange={handleProfileChange} min={10} step={5} />
                 <SelectField label="Dietary Preference" name="dietaryRestrictions" value={profile.dietaryRestrictions} onChange={handleProfileChange} disabled={false}>
                    <option value="none">None</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="pescetarian">Pescetarian</option>
                    <option value="gluten_free">Gluten-Free</option>
                </SelectField>
                <div className="md:col-span-2">
                    <TextareaField label="Allergies or Foods to Avoid" name="allergies" value={profile.allergies} onChange={handleProfileChange} disabled={false} placeholder="e.g., Peanuts, shellfish, dairy" required={false} />
                </div>
            </div>
        </section>

        {/* Section: Goals */}
        <section className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Your Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <SelectField label="Primary Fitness Goal" name="fitnessGoal" value={profile.fitnessGoal} onChange={handleProfileChange} disabled={false}>
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_gain">Muscle Gain</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="endurance">Improve Endurance</option>
                    </SelectField>
                </div>
                <div className="md:col-span-2">
                    <TextareaField label="Describe Your Goal in More Detail" name="detailedGoal" value={profile.detailedGoal} onChange={handleProfileChange} disabled={false} placeholder="e.g., I want to lose 5kg before my vacation in 3 months, and I want to feel stronger and have more energy." rows={3} required={true} />
                </div>
                <h4 className="md:col-span-2 text-lg font-medium text-gray-800 mt-2">Set Your Daily Targets</h4>
                <InputField label="Steps" name="steps" type="number" value={profile.dailyTargets.steps} onChange={handleTargetsChange} min={0} step={500} />
                <InputField label="Calories to Burn" name="caloriesBurned" type="number" value={profile.dailyTargets.caloriesBurned} onChange={handleTargetsChange} min={0} step={50} />
                <InputField label="Exercise (minutes)" name="exerciseMinutes" type="number" value={profile.dailyTargets.exerciseMinutes} onChange={handleTargetsChange} min={0} step={5} />
                <InputField label="Water Intake (liters)" name="waterIntake" type="number" value={profile.dailyTargets.waterIntake} onChange={handleTargetsChange} min={0} step={0.25} />
                <InputField label="Sleep (hours)" name="sleepHours" type="number" value={profile.dailyTargets.sleepHours} onChange={handleTargetsChange} min={0} max={16} step={0.5} />
            </div>
        </section>

        {/* Section: Today's Activity */}
        <section className="p-6 border border-gray-200 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 border-b pb-2">
                <h3 className="text-xl font-semibold text-gray-900">Today's Starting Activity</h3>
                <button type="button" onClick={handleGoogleFitSync} className="mt-2 sm:mt-0 text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    Sync with Google Fit (Demo)
                </button>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                 <InputField label="Steps Taken" name="steps" type="number" value={activity.steps} onChange={handleActivityChange} min={0} step={100} />
                 <InputField label="Calories Burned" name="caloriesBurned" type="number" value={activity.caloriesBurned} onChange={handleActivityChange} min={0} step={10} />
                 <InputField label="Resting Heart Rate" name="heartRate" type="number" value={activity.heartRate} onChange={handleActivityChange} min={30} max={120} />
                 <InputField label="Hours of Sleep" name="sleepHours" type="number" value={activity.sleepHours} onChange={handleActivityChange} min={0} max={24} step={0.5} />
                 <InputField label="Mins of Exercise" name="exerciseMinutes" type="number" value={activity.exerciseMinutes} onChange={handleActivityChange} min={0} step={1} />
             </div>
        </section>

        <div className="flex flex-col items-center justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-4 pt-4">
          {isPlanAccepted && onCancel && (
            <button type="button" onClick={onCancel} className="w-full md:w-auto inline-flex justify-center items-center py-3 px-12 border border-gray-300 shadow-sm text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                Back to Dashboard
            </button>
          )}
          <button type="submit" className="w-full md:w-auto inline-flex justify-center items-center py-3 px-12 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
            {isPlanAccepted ? 'Regenerate My Plan' : 'Generate My Personalized Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;