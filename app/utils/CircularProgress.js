import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// Komponenta za kružni napredak
const CircularProgress = ({ percentage }) => {
  const radius = 25; // Polumjer kruga
  const strokeWidth = 10; // Debljina linije
  const diameter = radius * 2; // Promjer
  const circumference = 2 * Math.PI * radius; // Opseg
  const progress = (percentage / 100) * circumference; // Progres na temelju postotka

  return (
    <View>
      <Svg width={diameter} height={diameter} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Pozadinski krug */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke="#2E4834"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progres krug */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke="#fff"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
CircularProgress.propTypes = {
  percentage: PropTypes.number.isRequired,
};

export default CircularProgress;