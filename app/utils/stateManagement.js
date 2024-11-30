let stepCountSetter = null;
let coinsSetter = null;

export const setStepCountSetter = (setter) => {
  stepCountSetter = setter;
};

export const setCoinsSetter = (setter) => {
  coinsSetter = setter;
};

export const setStepCount = (count) => {
  if (stepCountSetter) {
    stepCountSetter(count);
  }
};

export const setCoins = (coins) => {
  if (coinsSetter) {
    coinsSetter(coins);
  }
};

export default {
  setStepCount,
  setCoins,
  setStepCountSetter,
  setCoinsSetter,
};