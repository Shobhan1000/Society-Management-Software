import { Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const ProgressCircle = ({ progress }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  // Clamp progress between -1 and 1
  const clamped = Math.max(Math.min(progress, 1), -1);
  const absProgress = Math.abs(clamped);

  // For negative values, offset clockwise minus absProgress to make it anticlockwise
  const dashOffset =
    clamped >= 0
      ? circumference * (1 - absProgress) // clockwise
      : circumference * (1 + absProgress); // anticlockwise

  return (
    <Box position="relative" display="inline-flex" width={50} height={50}>
      <svg width={50} height={50}>
        {/* Base circle */}
        <circle
          cx={25}
          cy={25}
          r={radius}
          stroke={colors.grey[700]}
          strokeWidth={4}
          fill="none"
        />

        {/* Progress overlay */}
        <circle
          cx={25}
          cy={25}
          r={radius}
          stroke={clamped >= 0 ? colors.greenAccent[500] : colors.redAccent[500]}
          strokeWidth={4}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 25 25)" // start from top
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );
};

export default ProgressCircle;