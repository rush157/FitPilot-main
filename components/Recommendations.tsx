import React, { useState } from 'react';
import { FitnessPlan, WorkoutDay, DietDay, Meal, Exercise } from '../types';
import { DumbbellIcon, UtensilsIcon, BrainIcon, MuscleIcon, PlayIcon, SwapIcon } from './Icons';
import AIImage from './AIImage';

interface RecommendationsProps {
  proposedPlan: FitnessPlan | null;
  acceptedPlan: FitnessPlan | null;
  error: string | null;
  onAcceptPlan: (plan: FitnessPlan) => void;
  onStartWorkout?: (dayPlan: WorkoutDay) => void;
  onSwapMeal: (dayIndex: number, mealIndex: number, meal: Meal) => Promise<void>;
  onSwapExercise: (dayIndex: number, exerciseIndex: number, exercise: Exercise, difficulty: 'easier' | 'harder') => Promise<void>;
}

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
        <div className="flex">
            <div className="py-1">
                <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <p className="text-lg font-bold text-red-800">Oops! Something went wrong.</p>
                <p className="text-sm text-red-700 mt-1">{message}</p>
            </div>
        </div>
    </div>
);

const Recommendations: React.FC<RecommendationsProps> = (props) => {
    const { proposedPlan, acceptedPlan, error, onAcceptPlan } = props;
    const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'advice'>('workout');

    if (error) return <ErrorDisplay message={error} />;
    
    const plan = proposedPlan || acceptedPlan;
    if (!plan) return <div className="text-center p-8 text-gray-500">No plan available. Please generate one from your profile.</div>;
    
    const isProposal = !!proposedPlan;

    return (
        <div className="w-full">
             {isProposal && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                    <h3 className="font-bold text-blue-800">Review Your Proposed Plan</h3>
                    <p className="text-sm text-blue-700">This is a draft from your AI coach. Feel free to swap exercises or meals until it's perfect, then click "Accept Plan" below to lock it in!</p>
                </div>
            )}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('workout')} className={`${activeTab === 'workout' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                        <DumbbellIcon className="mr-2" /> Workout Plan
                    </button>
                    <button onClick={() => setActiveTab('diet')} className={`${activeTab === 'diet' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                        <UtensilsIcon className="mr-2" /> Diet Plan
                    </button>
                    <button onClick={() => setActiveTab('advice')} className={`${activeTab === 'advice' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                       <BrainIcon className="mr-2" /> General Advice
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'workout' && <WorkoutPlanView {...props} isProposal={isProposal} />}
                {activeTab === 'diet' && <DietPlanView {...props} isProposal={isProposal} />}
                {activeTab === 'advice' && <GeneralAdviceView advice={plan.generalAdvice} />}
            </div>

            {isProposal && (
                <div className="mt-8 text-center">
                    <button onClick={() => onAcceptPlan(proposedPlan)} className="py-3 px-12 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                        Accept This Plan & Get Started!
                    </button>
                </div>
            )}
        </div>
    );
};

const LiquidProgressCard: React.FC<{ day: WorkoutDay; onStartWorkout: (day: WorkoutDay) => void; isProposal: boolean; }> = ({ day, onStartWorkout, isProposal }) => {
    const progress = day.exercises.length > 0 ? ((day.completedExercisesCount || 0) / day.exercises.length) * 100 : 0;
    const progressStyle = { '--progress-percent': `${progress}%` } as React.CSSProperties;

    return (
        <div className={`bg-white p-6 rounded-xl shadow-lg relative liquid-progress-card ${day.isCompleted ? 'bg-green-50' : ''}`}>
            <div className="liquid-fill" style={progressStyle}></div>
            <div className="relative z-10">
                {day.isCompleted && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        COMPLETED!
                    </div>
                )}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{day.dayOfWeek}</h3>
                        <p className="text-indigo-600 font-medium">{day.focus}</p>
                    </div>
                    {!isProposal && (
                        <button onClick={() => onStartWorkout(day)} disabled={day.isCompleted} className="flex items-center bg-green-500 text-white font-bold py-2 px-4 rounded-full hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <PlayIcon className="mr-2"/>
                            {day.isCompleted ? 'Done!' : 'Start Session'}
                        </button>
                    )}
                </div>
                {/* Exercise list can be shown here if desired, or kept minimal */}
            </div>
        </div>
    );
};


const WorkoutPlanView: React.FC<RecommendationsProps & { isProposal: boolean }> = ({ acceptedPlan, proposedPlan, onStartWorkout, onSwapExercise, isProposal }) => {
    const plan = isProposal ? proposedPlan?.workoutPlan : acceptedPlan?.workoutPlan;
    const [swapping, setSwapping] = useState<string | null>(null);
    const [swapError, setSwapError] = useState<{ id: string, message: string } | null>(null);

    if (!plan) {
        return <div className="text-center p-8 text-gray-500">Workout plan is not available.</div>;
    }
    
    if (!isProposal && acceptedPlan?.workoutPlan && onStartWorkout) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIndex = new Date().getDay();
        const todayName = daysOfWeek[todayIndex];
        const tomorrowName = daysOfWeek[(todayIndex + 1) % 7];

        const todayPlan = acceptedPlan.workoutPlan.find(d => d.dayOfWeek === todayName);
        const tomorrowPlan = acceptedPlan.workoutPlan.find(d => d.dayOfWeek === tomorrowName);

        return (
            <div className="space-y-8">
                {todayPlan && (
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Today's Plan</h2>
                        <LiquidProgressCard day={todayPlan} onStartWorkout={onStartWorkout} isProposal={isProposal} />
                    </div>
                )}
                {tomorrowPlan && (
                     <div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Tomorrow's Plan</h2>
                        <div className="opacity-80">
                            <LiquidProgressCard day={tomorrowPlan} onStartWorkout={onStartWorkout} isProposal={isProposal} />
                        </div>
                    </div>
                )}
                 {!todayPlan && !tomorrowPlan && (
                     <p className="text-center text-gray-500 p-8">No workouts scheduled for today or tomorrow. Enjoy your rest!</p>
                 )}
            </div>
        );
    }


    const handleSwap = async (dayIndex: number, exerciseIndex: number, exercise: Exercise, difficulty: 'easier' | 'harder') => {
        const swapId = `${dayIndex}-${exerciseIndex}`;
        setSwapping(swapId);
        setSwapError(null);
        try {
            await onSwapExercise(dayIndex, exerciseIndex, exercise, difficulty);
        } catch (e: any) {
            setSwapError({ id: swapId, message: e.message || 'Swap failed. AI model may be busy.' });
        } finally {
            setSwapping(null);
        }
    }
    
    return (
    <div className="space-y-10">
        {plan.map((day, dayIndex) => (
            <div key={day.dayOfWeek} className={`bg-white p-6 rounded-xl shadow-lg relative overflow-hidden ${day.isCompleted ? 'bg-green-50 completed-shine' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{day.dayOfWeek}</h3>
                        <p className="text-indigo-600 font-medium">{day.focus}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {day.exercises.map((ex, exIndex) => {
                        const isSwapping = swapping === `${dayIndex}-${exIndex}`;
                        const errorForThis = swapError?.id === `${dayIndex}-${exIndex}`;
                        return (
                        <div key={exIndex} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between relative">
                             <AIImage prompt={ex.imageUrl} alt={`Image of ${ex.name}`} className="w-full h-40 object-cover rounded-md mb-4" />
                             <div>
                                <div className="relative has-tooltip">
                                    <p className="font-bold text-lg text-gray-800 cursor-help">{ex.name}</p>
                                    <div className="tooltip-text absolute bottom-full mb-2 w-60 bg-gray-800 text-white text-xs rounded py-2 px-3 pointer-events-none z-10">
                                        {ex.description}
                                        <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 font-semibold">{ex.sets} sets of {ex.reps} {ex.duration ? `(${ex.duration}s)` : ''}</p>
                                <div className="flex items-center text-sm text-gray-600 mt-2">
                                    <MuscleIcon className="mr-2 text-indigo-500"/>
                                    <span>Target: {ex.targetMuscle}</span>
                                </div>
                            </div>
                            <a href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(ex.name)}`} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-center font-medium text-indigo-600 hover:text-indigo-800">Watch Demo <i className="fas fa-external-link-alt ml-1"></i></a>
                            {isProposal && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-around">
                                        <button disabled={isSwapping} onClick={() => handleSwap(dayIndex, exIndex, ex, 'easier')} className="text-xs font-medium text-green-600 hover:text-green-800 disabled:text-gray-400">Swap (Easier)</button>
                                        <button disabled={isSwapping} onClick={() => handleSwap(dayIndex, exIndex, ex, 'harder')} className="text-xs font-medium text-red-600 hover:text-red-800 disabled:text-gray-400">Swap (Harder)</button>
                                    </div>
                                    {errorForThis && <p className="text-xs text-center text-red-500 mt-2">{swapError.message}</p>}
                                </div>
                            )}
                            {isSwapping && <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg"><SwapIcon className="animate-spin h-8 w-8 text-indigo-600" /></div>}
                        </div>
                    )})}
                </div>
            </div>
        ))}
    </div>
)};

const DietPlanView: React.FC<RecommendationsProps & { isProposal: boolean }> = ({ proposedPlan, acceptedPlan, onSwapMeal, isProposal }) => {
    const plan = isProposal ? proposedPlan?.dietPlan : acceptedPlan?.dietPlan;
    const [swapping, setSwapping] = useState<string | null>(null);
    const [swapError, setSwapError] = useState<{ id: string, message: string } | null>(null);
    
    if (!plan) {
        return <div className="text-center p-8 text-gray-500">Diet plan is not available.</div>;
    }
    
    if (!isProposal && acceptedPlan?.dietPlan) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIndex = new Date().getDay();
        const todayName = daysOfWeek[todayIndex];
        const tomorrowName = daysOfWeek[(todayIndex + 1) % 7];

        const todayPlan = acceptedPlan.dietPlan.find(d => d.dayOfWeek === todayName);
        const tomorrowPlan = acceptedPlan.dietPlan.find(d => d.dayOfWeek === tomorrowName);

        const PlanCard: React.FC<{ day: DietDay, title: string, isFaded?: boolean}> = ({ day, title, isFaded }) => (
            <div className={isFaded ? 'opacity-80' : ''}>
                <h2 className={`mb-4 ${isFaded ? 'text-2xl font-semibold text-gray-700' : 'text-3xl font-bold text-gray-800'}`}>{title}</h2>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-baseline mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">{day.dayOfWeek}</h3>
                        <p className="text-lg font-semibold text-green-600">{day.dailyCalorieTarget.toLocaleString()} kcal</p>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {day.meals.map((meal, mealIndex) => (
                             <div key={mealIndex} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                                <AIImage prompt={meal.imageUrl} alt={meal.description} className="w-full h-32 object-cover"/>
                                <div className="p-4 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800">{meal.name}</h4>
                                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">{meal.calories} kcal</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 flex-grow">{meal.description}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        );

        return (
            <div className="space-y-8">
                {todayPlan && <PlanCard day={todayPlan} title="Today's Meals" />}
                {tomorrowPlan && <PlanCard day={tomorrowPlan} title="Tomorrow's Meals" isFaded />}
                {!todayPlan && !tomorrowPlan && <p className="text-center text-gray-500 p-8">No meals scheduled for today or tomorrow.</p>}
            </div>
        )
    }

    const handleSwap = async (dayIndex: number, mealIndex: number, meal: Meal) => {
        const swapId = `${dayIndex}-${mealIndex}`;
        setSwapping(swapId);
        setSwapError(null);
        try {
            await onSwapMeal(dayIndex, mealIndex, meal);
        } catch (e: any) {
             setSwapError({ id: swapId, message: e.message || 'Swap failed. AI model may be busy.' });
        } finally {
            setSwapping(null);
        }
    }
    
    return (
        <div className="space-y-8">
            {plan.map((day, dayIndex) => (
                <div key={day.dayOfWeek} className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-baseline mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">{day.dayOfWeek}</h3>
                        <p className="text-lg font-semibold text-green-600">{day.dailyCalorieTarget.toLocaleString()} kcal</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {day.meals.map((meal, mealIndex) => {
                            const isSwapping = swapping === `${dayIndex}-${mealIndex}`;
                            const errorForThis = swapError?.id === `${dayIndex}-${mealIndex}`;
                            return (
                            <div key={mealIndex} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                                <AIImage prompt={meal.imageUrl} alt={meal.description} className="w-full h-32 object-cover"/>
                                <div className="p-4 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800">{meal.name}</h4>
                                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">{meal.calories} kcal</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 flex-grow">{meal.description}</p>
                                    <div className="text-xs text-gray-500 mt-3 grid grid-cols-3 gap-2 text-center">
                                        <div><span className="font-bold">{meal.macros.protein}g</span><br/>Protein</div>
                                        <div><span className="font-bold">{meal.macros.carbs}g</span><br/>Carbs</div>
                                        <div><span className="font-bold">{meal.macros.fat}g</span><br/>Fat</div>
                                    </div>
                                    {isProposal && (
                                        <div className="mt-4 pt-4 border-t">
                                            <button onClick={() => handleSwap(dayIndex, mealIndex, meal)} disabled={isSwapping} className="w-full flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-wait">
                                            {isSwapping ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg> : <><SwapIcon className="h-5 w-5 mr-2"/> Swap Meal</>}
                                            </button>
                                            {errorForThis && <p className="text-xs text-center text-red-500 mt-2">{swapError.message}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            ))}
        </div>
    );
}

const GeneralAdviceView: React.FC<{ advice: string[] }> = ({ advice }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Wellness & Motivation Tips</h3>
        <ul className="space-y-4">
            {advice.map((tip, index) => (
                <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700">{tip}</p>
                </li>
            ))}
        </ul>
    </div>
);

export default Recommendations;