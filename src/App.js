import React, { useEffect, useState, useCallback } from 'react';

function App() {
  const [stepCount, setStepCount] = useState(0);
  const [distance, setDistance] = useState(0); // Distance in meters
  const [updateLog, setUpdateLog] = useState(["Initial setup completed on " + new Date().toLocaleString()]);
  const [location, setLocation] = useState(null); // User's current location
  const [prevLocation, setPrevLocation] = useState(null); // User's previous location
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Average step length (in meters), adjusted for an average adult
  const averageStepLength = 0.78; // Approx. 78 cm
  const threshold = 13; // Threshold for motion detection

  // Function to calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleMotionEvent = useCallback(
    (event) => {
      const { acceleration } = event;
      if (acceleration) {
        const magnitude = Math.sqrt(
          acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
        );

        if (magnitude > threshold) {
          setStepCount((prev) => prev + 1);
        }
      }
    },
    [threshold]
  );

  useEffect(() => {
    // Update the distance whenever the step count changes
    setDistance(stepCount * averageStepLength);
  }, [stepCount]);

  const startTracking = useCallback(() => {
    if (!isTracking) {
      window.addEventListener('devicemotion', handleMotionEvent);
      setIsTracking(true);
    }
  }, [isTracking, handleMotionEvent]);

  const stopTracking = useCallback(() => {
    if (isTracking) {
      window.removeEventListener('devicemotion', handleMotionEvent);
      setIsTracking(false);
    }
  }, [isTracking, handleMotionEvent]);

  useEffect(() => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            setPermissionGranted(true);
            startTracking();
          }
        })
        .catch(console.error);
    } else {
      setPermissionGranted(true);
      startTracking();
    }

    return () => stopTracking();
  }, [startTracking, stopTracking]);

  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Current position:', { latitude, longitude });
          if (prevLocation) {
            const distanceTraveled = calculateDistance(
              prevLocation.latitude,
              prevLocation.longitude,
              latitude,
              longitude
            );
            console.log('Distance traveled:', distanceTraveled);
            setDistance((prevDistance) => prevDistance + distanceTraveled);
          }
          setPrevLocation({ latitude, longitude });
          setLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [prevLocation]);

  const handleNotificationClick = () => {
    alert(`Update Log:\n${updateLog.join('\n')}`);
  };

  return (
    <div className="min-h-screen bg-cgreen flex flex-col items-center justify-center p-4 space-y-8">
      {/* Step Counter Section */}
      <div className="bg-cdarkgreen bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Step Counter</h1>
        {permissionGranted ? (
          <>
            <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white">
              {stepCount}
            </div>
            <div className="text-white text-md sm:text-lg mt-2">Steps Taken</div>
            <div className="mt-6">
              <span className='text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4'>/10,000</span>
            </div>
            <button
              onClick={() => setStepCount(0)}
              className="mt-6 px-4 py-2 bg-cgreen text-white rounded-lg shadow-md hover:border-cdarkgreen transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleNotificationClick}
              className="mt-6 ml-4 px-4 py-2 bg-cdarkgreen text-white rounded-lg shadow-md hover:border-cgreen transition-colors"
            >
              Show Last Update
            </button>
          </>
        ) : (
          <div className="text-white">Permission to access motion sensors was denied.</div>
        )}
      </div>

      {/* Distance Section */}
      <div className="bg-cdarkgreen bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Distance Walked</h1>
        <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white">
          {distance.toFixed(2)} m
        </div>
        <div className="text-white text-md sm:text-lg mt-2">Meters Covered</div>
      </div>
    </div>
  );
}

export default App;