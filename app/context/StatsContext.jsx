import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [stepGoal, setStepGoal] = useState(0);
  const [coins, setCoins] = useState(0);

  return (
    <StatsContext.Provider value={{ caloriesBurned, setCaloriesBurned, distance, setDistance, stepCount, setStepCount, stepGoal, setStepGoal, coins, setCoins }}>
      {children}
    </StatsContext.Provider>
  );
};

StatsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useStats = () => useContext(StatsContext);
