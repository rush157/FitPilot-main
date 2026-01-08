import React, { useState, useEffect } from 'react';

const messages = [
  "Analyzing your goals...",
  "Consulting with our AI nutritionists...",
  "Designing your workouts...",
  "Finding the perfect motivational quote...",
  "Almost there, personalizing your advice...",
];

const FormulatingPlan: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 80); // Fakes a ~8 second generation time

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Crafting Your Plan</h2>
        <p className="text-gray-600 mb-8">
          Your personal AI coach, FitPilot, is creating a unique plan just for you.
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-4 rounded-full transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-indigo-600 font-semibold animate-pulse h-6">
          {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default FormulatingPlan;
