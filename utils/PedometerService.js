import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STEP_LENGTH = 0.75; // in meters

class PedometerService {
  constructor() {
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.lastPeakTime = 0;
    this.stepThreshold = 1.2;
    this.walkingState = false;
    this.recentMagnitudes = [];
    this.rateTrackingStart = Date.now();
    this.startingSteps = 0;
  }

  async initializeDevice() {
    try {
      // Use Device API methods for calibration
      const brand = await Device.getBrandAsync();
      const model = await Device.getModelAsync();
      
      // Adjust based on known device sensitivities
      if (brand.toLowerCase().includes('samsung')) {
        this.stepThreshold = 1.1; 
      } else if (brand.toLowerCase().includes('xiaomi')) {
        this.stepThreshold = 0.9;
      } else if (brand.toLowerCase().includes('huawei')) {
        this.stepThreshold = 1.0; 
      } else if (brand.toLowerCase().includes('oneplus')) {
        this.stepThreshold = 1.2;
      }
      
      console.log(`Device-specific calibration applied: ${brand} ${model}, threshold: ${this.stepThreshold}`);
    } catch (error) {
      console.log('Could not apply device-specific calibration:', error);
    }
  }

  subscribe(onStepDetected, currentStepCount) {
    // Store the starting step count to track progress
    this.startingSteps = currentStepCount || 0;
    console.log('PedometerService starting with step count:', this.startingSteps);
    
    if (!this.accelerometerSubscription) {
      this.accelerometerSubscription = Accelerometer.addListener(acceleration => {
        this.detectStep(acceleration, this.gyroData, onStepDetected);
      });
      // Better balance between accuracy and battery
      Accelerometer.setUpdateInterval(100); // More sensitive for better step detection
    }
    
    if (!this.gyroscopeSubscription) {
      this.gyroscopeSubscription = Gyroscope.addListener(gyro => {
        this.gyroData = gyro;
      });
      Gyroscope.setUpdateInterval(100);
    }
  
    // Start tracking step rate
    this.startStepRateTracking();
  }

  unsubscribe() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    if (this.stepRateInterval) {
      clearInterval(this.stepRateInterval);
    }
  }

  detectStep(acceleration, gyroData, onStepDetected) {
    const alpha = 0.25; // Low-pass filter strength
    const filteredAcceleration = {
      x: alpha * this.lastAcceleration.x + (1 - alpha) * acceleration.x,
      y: alpha * this.lastAcceleration.y + (1 - alpha) * acceleration.y,
      z: alpha * this.lastAcceleration.z + (1 - alpha) * acceleration.z,
    };

    const deltaX = Math.abs(filteredAcceleration.x - this.lastAcceleration.x);
    const deltaY = Math.abs(filteredAcceleration.y - this.lastAcceleration.y);
    const deltaZ = Math.abs(filteredAcceleration.z - this.lastAcceleration.z);

    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    // Keep recent magnitudes for adaptive threshold
    this.recentMagnitudes = [...this.recentMagnitudes, magnitude].slice(-20);
    
    // Calculate average magnitude to detect if user is walking
    const avgMagnitude = this.recentMagnitudes.reduce((sum, val) => sum + val, 0) / this.recentMagnitudes.length;
    
    // For Android-specific continuous tracking
    const isWalking = avgMagnitude > 0.4;  // Lower threshold for better sensitivity
    if (isWalking !== this.walkingState) {
      this.walkingState = isWalking;
      console.log(isWalking ? "Walking detected" : "Walking stopped");
    }
    
    // Dynamic threshold based on recent activity
    if (this.recentMagnitudes.length > 10) {
      const dynamicThreshold = Math.max(0.6, Math.min(1.3, avgMagnitude * 1.4));
      if (Math.abs(dynamicThreshold - this.stepThreshold) > 0.15) {
        this.stepThreshold = dynamicThreshold;
      }
    }

    const currentTime = Date.now();
    const timeSinceLastPeak = currentTime - this.lastPeakTime;

    // Sliding scale of sensitivity based on movement patterns
    const effectiveThreshold = this.walkingState ? 
      this.stepThreshold : 
      Math.min(1.8, this.stepThreshold * 1.8); // Higher threshold when not clearly walking
    
    if (magnitude > effectiveThreshold && timeSinceLastPeak > 350) { // Slightly reduced time between steps
      onStepDetected && onStepDetected();
      this.lastPeakTime = currentTime;
    }

    this.lastAcceleration = filteredAcceleration;
  }

  startStepRateTracking() {
    // Track step rate for background estimation
    this.stepRateInterval = setInterval(() => {
      this.calculateStepRate();
    }, 60000); // Check every minute
  }

  async calculateStepRate() {
    try {
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const currentStepCount = parseInt(storedStepCount || '0', 10);
      
      const now = Date.now();
      const elapsedMinutes = (now - this.rateTrackingStart) / (1000 * 60);
      
      if (elapsedMinutes >= 5) {
        const stepsTaken = currentStepCount - this.startingSteps;
        const stepsPerMinute = stepsTaken / elapsedMinutes;
        
        // Only store if user was actively walking
        if (stepsPerMinute > 3) {
          AsyncStorage.setItem('recentStepRate', stepsPerMinute.toString());
          console.log(`Recorded step rate: ${stepsPerMinute.toFixed(1)} steps/minute`);
        }
        
        // Reset for next period
        this.rateTrackingStart = now;
        this.startingSteps = currentStepCount;
      }
    } catch (error) {
      console.error('Error calculating step rate:', error);
    }
  }

  // These methods need to be properly accessible as instance methods
  calculateCaloriesBurned(steps, weight) {
    const caloriesPerKgPerStep = 0.0005; // Simplified calculation
    return weight * caloriesPerKgPerStep * steps;
  }

  calculateDistance(steps) {
    return (steps * STEP_LENGTH) / 1000; // Convert to kilometers
  }
}

// Create a single instance of the service
const pedometerService = new PedometerService();

// Export the instance as default
export default pedometerService;