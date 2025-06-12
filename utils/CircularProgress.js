import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * CircularProgress - Komponenta kružnog indikatora napretka
 * 
 * Ova komponenta stvara vizualno atraktivan kružni indikator koji prikazuje
 * postotak dovršenosti neke aktivnosti ili zadatka. Indikator se sastoji od:
 * - Pozadinskog kruga koji predstavlja 100% vrijednosti
 * - Prednjeg kruga koji pokazuje trenutni postotak popunjenosti
 * 
 * Komponenta koristi SVG za glatko iscrtavanje i dobro skaliranje na svim uređajima.
 *
 * @param {number} percentage - Postotak napretka (0-100)
 * @returns {React.Component} - Renderirana SVG komponenta kružnog indikatora
 */
const CircularProgress = ({ percentage }) => {
  // --- DIMENZIJE I KONSTANTE ---
  
  // Osnovni parametri kruga
  const radius = 25;        // Polumjer kruga u pikselima
  const strokeWidth = 10;   // Debljina obruba
  const diameter = radius * 2; // Promjer za određivanje veličine SVG-a
  
  // --- MATEMATIČKI IZRAČUNI ZA SVG ---
  
  // Izračun opsega kruga i duljine luka koji predstavlja napredak
  const circumference = 2 * Math.PI * radius; // Formula za opseg kruga: 2πr
  const progressArc = (percentage / 100) * circumference; // Duljina luka za trenutni postotak
  
  // --- RENDER KOMPONENTE ---
  return (
    <View>
      <Svg 
        width={diameter} 
        height={diameter} 
        style={{ transform: [{ rotate: '-90deg' }] }} // Rotiranje za početak od vrha kruga
      >
        {/* Pozadinski krug - puni opseg */}
        <Circle
          cx={radius} // Središte X
          cy={radius} // Središte Y
          r={radius - strokeWidth / 2} // Radijus (umanjen za pola debljine da stane u okvir)
          stroke="#2E4834" // Tamnozelena pozadina
          strokeWidth={strokeWidth}
          fill="none" // Prazan unutarnji prostor
        />
        
        {/* Krug napretka - prikazuje postotak */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke="#fff" // Bijela boja za napredak
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference} // Ukupna duljina crte
          strokeDashoffset={circumference - progressArc} // Skriveni dio crte (obrnuti izračun)
          strokeLinecap="round" // Zaobljeni vrhovi za ljepši izgled
        />
      </Svg>
    </View>
  );
};

// Validacija parametara komponente
CircularProgress.propTypes = {
  percentage: PropTypes.number.isRequired, // Postotak mora biti broj i obavezan je
};

export default CircularProgress;