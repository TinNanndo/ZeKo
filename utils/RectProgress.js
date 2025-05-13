import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

// Komponenta za pravokutni napredak
const RectProgress = ({ percentage, width = 81, height = 110, strokeColor = '#fff', strokeWidth = 16, borderRadius = 15 }) => {
  const perimeter = 2 * (width + height); // Opseg pravokutnika
  const progressLength = (percentage / 100) * perimeter; // Duljina progres linije na temelju postotka

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Pozadinski pravokutnik */}
        <Rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke="#2E4834"
          strokeWidth={strokeWidth}
        />
        {/* Progres pravokutnik */}
        <Rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={strokeColor} // Use the strokeColor prop
          strokeWidth={strokeWidth}
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter - progressLength}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

RectProgress.propTypes = {
  percentage: PropTypes.number.isRequired,
  width: PropTypes.number, // Add width prop type
  height: PropTypes.number, // Add height prop type
  strokeWidth : PropTypes.number,
  borderRadius: PropTypes.number,
  strokeColor: PropTypes.string, // Add strokeColor prop type
};

export default RectProgress;