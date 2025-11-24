import {
  Box,
  IconButton,
  useTheme,
  Badge,
  Popover,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";

// Map alert types to icons and colors
const typeStyles = (type) => {
  switch (type?.toLowerCase()) {
    case "low stock":
      return { 
        icon: <WarningIcon fontSize="small" sx={{ color: "#FFA726" }} />,
        color: "#FFA726",
        label: "Low Stock"
      };
    case "expiry":
      return { 
        icon: <ErrorIcon fontSize="small" sx={{ color: "#f44336" }} />,
        color: "#f44336",
        label: "Expiry"
      };
    case "warning":
      return { 
        icon: <WarningIcon fontSize="small" sx={{ color: "#ff9800" }} />,
        color: "#ff9800",
        label: "Warning"
      };
    case "error":
      return { 
        icon: <ErrorIcon fontSize="small" sx={{ color: "#f44336" }} />,
        color: "#f44336",
        label: "Error"
      };
    case "success":
      return { 
        icon: <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />,
        color: "#4caf50",
        label: "Success"
      };
    default:
      return { 
        icon: <InfoIcon fontSize="small" sx={{ color: "#2196f3" }} />,
        color: "#2196f3",
        label: "Info"
      };
  }
};

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const id = open ? "notifications-popover" : undefined;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState({}); // Store items by ID for name lookup

  // -------------------- FETCH ALERTS --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [alertsRes, itemsRes] = await Promise.all([
          fetch("http://localhost:8000/alerts/"),
          fetch("http://localhost:8000/items/")
        ]);

        if (!alertsRes.ok) throw new Error("Failed to fetch alerts");
        if (!itemsRes.ok) throw new Error("Failed to fetch items");

        const alertsData = await alertsRes.json();
        const itemsData = await itemsRes.json();

        // Create mapping of item IDs to item names
        const itemsMap = {};
        itemsData.forEach(item => {
          itemsMap[item.id] = item.itemName;
        });

        setAlerts(alertsData);
        setItems(itemsMap);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Get item name from item ID
  const getItemName = (itemId) => {
    return items[itemId] || "Unknown Item";
  };

  // Format alert message with item name if available
  const formatAlertMessage = (alert) => {
    if (alert.item_id && items[alert.item_id]) {
      return `${alert.message} (${getItemName(alert.item_id)})`;
    }
    return alert.message;
  };

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box display="flex" backgroundColor={colors.primary[400]} borderRadius="3px">
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex" alignItems="center">
        {/* Dark / Light Mode Toggle */}
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>

        {/* Notifications */}
        <IconButton onClick={handleClick}>
          <Badge badgeContent={alerts.length} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: 1 }}
        >
          <Box p={2} minWidth={300}>
            <Typography variant="h6" mb={1}>
              Notifications ({alerts.length})
            </Typography>
            <Stack spacing={1}>
              {loading ? (
                <Typography variant="body2" color={colors.grey[100]}>
                  Loading notifications...
                </Typography>
              ) : alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => {
                  const { icon, color, label } = typeStyles(alert.type);
                  return (
                    <Box
                      key={alert.id}
                      p={1.5}
                      borderRadius={1}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: colors.primary[600],
                        borderLeft: `4px solid ${color}`,
                        '&:hover': {
                          backgroundColor: colors.primary[700],
                        }
                      }}
                      onClick={() => {
                        navigate(`/alerts?alertId=${alert.id}`);
                        handleClose();
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        {icon}
                        <Box flex={1}>
                          <Typography variant="subtitle2" fontWeight="bold" color="white">
                            {alert.title}
                          </Typography>
                          <Typography variant="body2" color={colors.grey[300]} sx={{ mt: 0.5 }}>
                            {formatAlertMessage(alert)}
                          </Typography>
                          <Chip
                            label={label}
                            size="small"
                            sx={{
                              backgroundColor: color,
                              color: 'white',
                              fontSize: '0.6rem',
                              height: '18px',
                              mt: 0.5
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" color={colors.grey[100]}>
                  No notifications
                </Typography>
              )}
              {alerts.length > 5 && (
                <Typography 
                  variant="body2" 
                  color={colors.blueAccent[400]} 
                  textAlign="center"
                  sx={{ cursor: 'pointer', mt: 1 }}
                  onClick={() => {
                    navigate("/alerts");
                    handleClose();
                  }}
                >
                  View all {alerts.length} alerts
                </Typography>
              )}
            </Stack>
          </Box>
        </Popover>

        {/* Settings / Profile */}
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>
        <IconButton>
          <PersonOutlinedIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;