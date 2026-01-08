import React, { useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { WorkoutSessionState, WorkoutDay } from '../types';
import { CloseIcon } from './Icons';
import AIImage from './AIImage';
import { findYouTubeVideoForExercise } from '../services/geminiService';

interface WorkoutSessionProps {
  initialState: WorkoutSessionState;
  onEndWorkout: (completedDay: WorkoutDay) => void;
  onUpdateState: (newState: WorkoutSessionState | null) => void;
}

const VideoLoadingSkeleton: React.FC = () => (
    <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-center p-4">
        <div className="animate-pulse">
            <svg className="w-12 h-12 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.55a2 2 0 01.45 2.125V16a2 2 0 01-2 2h-1.5a2 2 0 01-2-2v-.875a2 2 0 01.45-1.125L15 10zM4.91 5.09a2 2 0 012.828 0l2.122 2.12a2 2 0 010 2.829l-2.122 2.12a2 2 0 01-2.828 0L2.788 9.91a2 2 0 010-2.828l2.122-2.12z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l-2.12-2.12a2 2 0 00-2.83 0L7.93 10.002c-.782.783-.782 2.047 0 2.83l2.121 2.121a2 2 0 002.829 0L15 10z" />
            </svg>
        </div>
        <p className="mt-4 text-gray-400 font-medium">Searching for exercise demonstration...</p>
    </div>
);


const WorkoutSession: React.FC<WorkoutSessionProps> = ({ initialState, onEndWorkout, onUpdateState }) => {
  const [sessionState, setSessionState] = useState<WorkoutSessionState>(initialState);
  const [isFetchingVideo, setIsFetchingVideo] = useState(false);

  const { dayPlan, currentExerciseIndex, currentSet, timer, status } = sessionState;
  const currentExercise = dayPlan.exercises[currentExerciseIndex];
  const totalSets = currentExercise.sets;
  const isTimedExercise = currentExercise.duration !== undefined && currentExercise.duration > 0;

  const updateState = useCallback((newState: Partial<WorkoutSessionState>) => {
    setSessionState(prevState => {
        const updated = { ...prevState, ...newState };
        onUpdateState(updated);
        return updated;
    });
  }, [onUpdateState]);

  useEffect(() => {
    const fetchVideoIfNeeded = async () => {
      if (!currentExercise.youtubeVideoId) {
        setIsFetchingVideo(true);
        try {
          const videoData = await findYouTubeVideoForExercise(currentExercise);
          const updatedExercises = [...dayPlan.exercises];
          updatedExercises[currentExerciseIndex] = {
            ...currentExercise,
            youtubeVideoId: videoData.youtubeVideoId,
            youtubeStartTime: videoData.youtubeStartTime,
          };
          
          updateState({ 
            dayPlan: { ...dayPlan, exercises: updatedExercises }
          });
        } catch (error) {
          console.error(`Failed to fetch fallback video for "${currentExercise.name}":`, error);
          // Gracefully fail; component will fall back to AIImage
        } finally {
          setIsFetchingVideo(false);
        }
      }
    };

    fetchVideoIfNeeded();
  }, [currentExercise]);

  const handleNextExercise = useCallback(() => {
    if (currentExerciseIndex < dayPlan.exercises.length - 1) {
      const nextExercise = dayPlan.exercises[currentExerciseIndex + 1];
      updateState({
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSet: 1,
        status: 'pre-start',
        timer: nextExercise.duration || 0,
      });
    } else {
      onEndWorkout(dayPlan);
    }
  }, [currentExerciseIndex, dayPlan, onEndWorkout, updateState]);

  const handleCompleteSet = useCallback(() => {
      if (currentSet < totalSets) {
        updateState({ status: 'resting', currentSet: currentSet + 1, timer: 30 });
      } else {
        handleNextExercise();
      }
  }, [currentSet, totalSets, handleNextExercise, updateState]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'working' && isTimedExercise) {
      if (timer > 0) {
        interval = setInterval(() => {
          updateState({ timer: sessionState.timer - 1 });
        }, 1000);
      } else {
        handleCompleteSet();
      }
    } else if (status === 'resting') {
        if (timer > 0) {
            interval = setInterval(() => {
                updateState({ timer: sessionState.timer - 1 });
            }, 1000);
        } else {
             updateState({ status: 'pre-start', timer: currentExercise.duration || 0 });
        }
    }
    return () => {
      if(interval) clearInterval(interval);
    };
  }, [timer, status, isTimedExercise, sessionState.timer, updateState, handleCompleteSet, currentExercise.duration]);
  
  const handleStartSet = () => {
    const newTimer = currentExercise.duration || 0;
    updateState({ status: 'working', timer: newTimer });
  };
  
  const handlePause = () => {
      updateState({ status: 'paused' });
  };
  
  const handleResume = () => {
      updateState({ status: 'working' });
  };
  
  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
       const prevExercise = dayPlan.exercises[currentExerciseIndex - 1];
       updateState({
        currentExerciseIndex: currentExerciseIndex - 1,
        currentSet: 1,
        status: 'pre-start',
        timer: prevExercise.duration || 0,
      });
    }
  };

  const progressPercentage = ((currentExerciseIndex) / dayPlan.exercises.length) * 100;

  const renderCentralDisplay = () => {
    // Resting State
    if (status === 'resting') {
      return (
        <div className="text-center">
          <p className="text-gray-400 text-sm">Rest Time</p>
          <p className="text-7xl font-mono font-bold">{timer}</p>
        </div>
      );
    }

    // Timed Exercise States
    if (isTimedExercise) {
      if (status === 'paused' || status === 'working') {
        return (
          <div className="text-center">
            <p className="text-gray-400 text-sm">{status === 'paused' ? 'Paused' : 'Time Remaining'}</p>
            <p className="text-7xl font-mono font-bold">{timer}</p>
          </div>
        );
      }
      // pre-start for timed
      return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
          <p className="text-lg font-semibold">Get ready for {currentExercise.duration} seconds</p>
          <p className="text-sm text-gray-400">Prepare to start the timer.</p>
        </div>
      );
    }

    // Rep-based Exercise States
    if (!isTimedExercise) {
      if (status === 'working') {
        return (
          <div className="text-center p-8">
            <p className="text-2xl font-bold animate-pulse text-green-400">Set in Progress</p>
            <p className="text-md text-gray-300 mt-2">Finish your reps, then tap Complete.</p>
          </div>
        );
      }
      // pre-start for reps
      return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
          <p className="text-lg font-semibold">Perform {currentExercise.reps}</p>
          <p className="text-sm text-gray-400">at your own pace</p>
        </div>
      );
    }

    return null; // Fallback
  };

  const renderTimerControls = () => {
    if (!isTimedExercise) {
      if (status === 'pre-start') return <button onClick={handleStartSet} className="w-full bg-green-500 hover:bg-green-600 font-bold py-4 rounded-lg transition-colors">Start Set {currentSet}</button>;
      if (status === 'working') return <button onClick={handleCompleteSet} className="w-full bg-green-500 hover:bg-green-600 font-bold py-4 rounded-lg transition-colors">Complete Set</button>;
    } else {
      if (status === 'pre-start') return <button onClick={handleStartSet} className="w-full bg-green-500 hover:bg-green-600 font-bold py-4 rounded-lg transition-colors">Start Timer</button>;
      if (status === 'working') return <button onClick={handlePause} className="w-full bg-yellow-500 hover:bg-yellow-600 font-bold py-4 rounded-lg transition-colors">Pause Timer</button>;
      if (status === 'paused') return <button onClick={handleResume} className="w-full bg-green-500 hover:bg-green-600 font-bold py-4 rounded-lg transition-colors">Resume Timer</button>;
    }
     if (status === 'resting') return <button onClick={() => updateState({ status: 'pre-start', timer: currentExercise.duration || 0 })} className="w-full bg-gray-600 hover:bg-gray-500 font-bold py-4 rounded-lg transition-colors">Skip Rest</button>;
     return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white w-full h-full md:h-auto md:max-h-[90vh] max-w-5xl shadow-2xl rounded-2xl overflow-hidden relative flex flex-col md:flex-row">
        <button 
          onClick={() => onUpdateState(null)} 
          className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors p-1 bg-gray-800 rounded-full"
          aria-label="Close workout session"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        {/* Left Column (Image & Progress) */}
        <div className="relative md:w-1/2 flex-shrink-0">
          <div className="absolute top-0 left-0 w-full bg-gray-700 h-2 z-10">
            <div className="bg-indigo-500 h-2 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <div className="w-full h-full bg-black aspect-video md:aspect-auto">
            {isFetchingVideo ? (
              <VideoLoadingSkeleton />
            ) : currentExercise.youtubeVideoId ? (
                <ReactPlayer
                  url={`https://www.youtube.com/watch?v=${currentExercise.youtubeVideoId}`}
                  playing
                  loop
                  muted
                  width="100%"
                  height="100%"
                  config={{
                    youtube: {
                      playerVars: { 
                        controls: 0, 
                        modestbranding: 1,
                        rel: 0,
                        start: currentExercise.youtubeStartTime || 0,
                      }
                    }
                  }}
                />
            ) : (
                <AIImage 
                  prompt={currentExercise.imageUrl} 
                  alt={`Image of ${currentExercise.name}`}
                  className="w-full h-full object-cover"
                />
            )}
          </div>
        </div>
        
        {/* Right Column (Info & Controls) */}
        <div className="flex-grow flex flex-col p-4 md:p-6 justify-between min-h-0 md:w-1/2 overflow-y-auto">
            <div className="flex-shrink-0">
              <h2 className="text-3xl md:text-4xl font-bold">{currentExercise.name}</h2>
              <p className="text-lg md:text-xl text-indigo-400">
                {status === 'resting' ? 'Rest' : `Set ${currentSet} of ${totalSets}`}
              </p>
              <p className="text-md md:text-lg text-gray-300">{currentExercise.reps}</p>
            </div>

            <div className="flex items-center justify-center my-4 flex-grow">
              {renderCentralDisplay()}
            </div>

            <div className="space-y-4 flex-shrink-0">
                {renderTimerControls()}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handlePrevExercise} disabled={currentExerciseIndex === 0} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Prev</button>
                    <button onClick={handleNextExercise} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors">
                      {currentExerciseIndex === dayPlan.exercises.length - 1 && currentSet >= totalSets ? 'Finish' : 'Next'}
                    </button>
                </div>
                {currentExerciseIndex < dayPlan.exercises.length - 1 && (
                    <div className="p-2 text-center text-sm text-gray-400 flex-shrink-0">
                        Up Next: {dayPlan.exercises[currentExerciseIndex + 1].name}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;