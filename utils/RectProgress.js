import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

/**
 * RectProgress - Komponenta za prikaz pravokutnog indikatora napretka
 * 
 * Ova komponenta stvara vizualni prikaz napretka u obliku pravokutnika
 * s naprednim SVG mogućnostima poput zaobljenih kutova i animiranog punjenja.
 * Koristi se za prikaz postotka dovršenosti aktivnosti u aplikaciji.
 * 
 * NAČIN RADA:
 * 1. Crta dva pravokutnika - pozadinski i pravokutnik napretka
 * 2. Koristi SVG strokeDasharray/strokeDashoffset za prikaz djelomičnog punjenja
 * 3. Izračunava duljinu crte na temelju postotka i opsega pravokutnika
 */
const RectProgress = ({ 
  percentage, 
  width = 81, 
  height = 110, 
  strokeColor = '#fff', 
  strokeWidth = 16, 
  borderRadius = 15 
}) => {
  // --- MATEMATIČKI IZRAČUNI ---
  
  // Izračun opsega pravokutnika (2 × širina + 2 × visina)
  const perimeter = 2 * (width + height);
  
  // Izračun duljine linije koja predstavlja trenutni napredak
  const progressLength = (percentage / 100) * perimeter;

  // --- SVG RENDERIRANJE ---
  return (
    <View>
      <Svg width={width} height={height}>
        {/* 
          Pozadinski pravokutnik - predstavlja ukupan napredak (100%)
          Prikazuje se kao tamnozeleni okvir 
        */}
        <Rect
          x={strokeWidth / 2}          // X pozicija (pomak za pola debljine linije)
          y={strokeWidth / 2}          // Y pozicija (pomak za pola debljine linije)
          width={width - strokeWidth}  // Širina unutar SVG-a (prilagođeno za debljinu linije)
          height={height - strokeWidth} // Visina unutar SVG-a (prilagođeno za debljinu linije)
          rx={borderRadius}            // Radijus zaobljenja X
          ry={borderRadius}            // Radijus zaobljenja Y
          fill="none"                  // Bez ispune
          stroke="#2E4834"             // Tamnozelena pozadina
          strokeWidth={strokeWidth}    // Debljina linije
        />
        
        {/* 
          Pravokutnik napretka - prikazuje trenutni postotak
          Prikazan bijelom linijom koja djelomično prekriva pozadinu 
        */}
        <Rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={strokeColor}            // Boja napretka (zadano bijela)
          strokeWidth={strokeWidth}
          strokeDasharray={perimeter}     // Definira ukupnu duljinu crte
          strokeDashoffset={perimeter - progressLength} // Dio crte koji je "skriven"
          strokeLinecap="round"           // Zaobljeni krajevi za ljepši izgled
        />
      </Svg>
    </View>
  );
};

// --- VALIDACIJA SVOJSTAVA ---

// Validacija parametara komponente pomoću PropTypes
RectProgress.propTypes = {
  percentage: PropTypes.number.isRequired, // Postotak mora biti broj i obavezan je
  width: PropTypes.number,                 // Opcijska širina komponente
  height: PropTypes.number,                // Opcijska visina komponente
  strokeWidth: PropTypes.number,           // Opcijska debljina obruba
  borderRadius: PropTypes.number,          // Opcijska zaobljenost kutova
  strokeColor: PropTypes.string,           // Opcijska boja linije napretka
};

export default RectProgress;