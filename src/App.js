import React, { useEffect, useState } from 'react';

function App() {
  const [stepCount, setStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const savedSteps = parseInt(localStorage.getItem('stepCount'), 10) || 0;
    setStepCount(savedSteps);
    // Request motion permissions on component mount
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            setPermissionGranted(true);
            startTracking();
          } else {
            console.warn('Permission not granted for motion sensors.');
          }
        })
        .catch(console.error);
    } else {
      // If no permission required, start tracking immediately
      setPermissionGranted(true);
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    localStorage.setItem('stepCount', stepCount);
  }, [stepCount]);

  const startTracking = () => {
    if (!isTracking) {
      window.addEventListener('devicemotion', handleMotionEvent);
      setIsTracking(true);
    }
  };

  const stopTracking = () => {
    if (isTracking) {
      window.removeEventListener('devicemotion', handleMotionEvent);
      setIsTracking(false);
    }
  };

  const handleMotionEvent = (event) => {
    const { acceleration } = event;
    if (acceleration) {
      const magnitude = Math.sqrt(
        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
      );
      const threshold = 1.5; // Adjust this value based on testing
      if (magnitude > threshold) {
        setStepCount((prevCount) => prevCount + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">🚶‍♂️ Pedometer</h1>
        {permissionGranted ? (
          <>
            <div
              className={`text-4xl sm:text-5xl md:text-6xl font-extrabold text-white transition-transform duration-300`}
            >
              {stepCount}
            </div>
            <div className="text-white text-md sm:text-lg mt-2">Steps Taken</div>
            <div className="mt-6">
              <ProgressBar steps={stepCount} />
            </div>
            <button
              onClick={() => setStepCount(0)}
              className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
            >
              Reset
            </button>
          </>
        ) : (
          <div className="text-white">
            Permission to access motion sensors was denied.
          </div>
        )}
      </div>
    </div>
  );
}

const ProgressBar = ({ steps }) => {
  const stepGoal = 10000; // Example step goal
  const progress = Math.min((steps / stepGoal) * 100, 100);

  return (
    <div className="w-full bg-gray-300 rounded-full h-4">
      <div
        className="bg-green-500 h-4 rounded-full transition-width duration-500"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default App;
