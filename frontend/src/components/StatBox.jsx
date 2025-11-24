import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import ProgressCircle from "./ProgressCircle";

const StatBox = ({ title, subtitle, icon, progress = 0, increase, showProgress = true }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Determine color for increase text based on progress sign
  const increaseColor =
    typeof progress === "number"
      ? progress > 0
        ? colors.greenAccent[500]
        : progress < 0
        ? colors.redAccent[500]
        : colors.grey[100]
      : colors.grey[100];

  return (
    <Box width="100%" m="0 30px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          {icon}
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: colors.grey[100] }}
          >
            {title}
          </Typography>
        </Box>

        {showProgress && (
          <Box>
            <ProgressCircle progress={progress} />
          </Box>
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
          {subtitle}
        </Typography>
        <Typography
          variant="h5"
          fontStyle="italic"
          sx={{ color: increaseColor }}
        >
          {increase}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;