"use client";

import { useState } from "react";
import { useEffectOnce } from "@/hooks/useEffectOnce";

export default function AnimatedSpreadsheet() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 12;

  useEffectOnce(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % totalFrames);
    }, 200);

    return () => clearInterval(interval);
  });

  const SpreadsheetWindow = ({ cellData }: { cellData: any[][] }) => {
    return (
      <div className="relative transition-all duration-500 ease-in-out scale-75 md:scale-100">
        {/* Window Shadow */}
        <div className="absolute w-[87px] h-[89px] left-[2px] bg-orange-600 rounded-lg" />
        
        {/* Window Background */}
        <div className="absolute w-[87px] h-[87px] bg-white dark:bg-stone-900 border-2 border-orange-600 rounded-lg">
          {/* Header Row */}
          <div className="absolute w-[87px] h-4 bg-orange-50 dark:bg-orange-950/30 border-b-2 border-orange-600 rounded-t-md" />
          
          {/* Grid Lines - Horizontal */}
          <div className="absolute w-[87px] h-[1px] bg-orange-600 top-[15px]" />
          <div className="absolute w-[87px] h-[1px] bg-orange-600 top-[30px]" />
          <div className="absolute w-[87px] h-[1px] bg-orange-600 top-[45px]" />
          <div className="absolute w-[87px] h-[1px] bg-orange-600 top-[60px]" />
          
          {/* Grid Lines - Vertical */}
          <div className="absolute w-[1px] h-[71px] bg-orange-600 left-[24px] top-4" />
          <div className="absolute w-[1px] h-[71px] bg-orange-600 left-[51px] top-4" />
          <div className="absolute w-[1px] h-[71px] bg-orange-600 left-[78px] top-4" />
          
          {/* Data cells */}
          {cellData.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const left = colIndex === 0 ? 6 : colIndex === 1 ? 28 : colIndex === 2 ? 56 : 80;
              const top = 20 + (rowIndex * 15);
              
              return cell > 0 ? (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="absolute h-1 bg-orange-300 dark:bg-orange-700 rounded-full transition-all duration-300"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${cell}px`,
                  }}
                />
              ) : null;
            })
          ))}
        </div>
      </div>
    );
  };

  // Different data states for animation progression - filling in order
  const spreadsheetData = [
    // Empty state
    [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 1, Col 1
    [[14, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 1, Col 2
    [[14, 12, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 1, Col 3
    [[14, 12, 16, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 2, Col 1
    [[14, 12, 16, 0], [7, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 2, Col 2
    [[14, 12, 16, 0], [7, 16, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 2, Col 3
    [[14, 12, 16, 0], [7, 16, 12, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    // Row 3, Col 1
    [[14, 12, 16, 0], [7, 16, 12, 0], [14, 0, 0, 0], [0, 0, 0, 0]],
    // Row 3, Col 2
    [[14, 12, 16, 0], [7, 16, 12, 0], [14, 16, 0, 0], [0, 0, 0, 0]],
    // Row 3, Col 3
    [[14, 12, 16, 0], [7, 16, 12, 0], [14, 16, 12, 0], [0, 0, 0, 0]],
    // Row 4, Col 1
    [[14, 12, 16, 0], [7, 16, 12, 0], [14, 16, 12, 0], [8, 0, 0, 0]],
    // Row 4, Col 2 and 3
    [[14, 12, 16, 0], [7, 16, 12, 0], [14, 16, 12, 0], [8, 14, 18, 0]],
  ];

  return (
    <div className="flex justify-center mb-2">
      <div className="relative w-[90px] h-[90px] md:w-[120px] md:h-[120px]">
        {/* Single spreadsheet that changes data over time */}
        <div className="absolute inset-0 opacity-0 animate-[fadeIn_0.5s_ease-in-out_forwards]">
          <SpreadsheetWindow cellData={spreadsheetData[currentFrame]} />
        </div>
      </div>
    </div>
  );
}
