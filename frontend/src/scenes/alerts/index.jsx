import {
  Box,
  Typography,
  useTheme,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InventoryIcon from "@mui/icons-material/Inventory";
import EventBusyIcon from "@mui/icons-material/EventBusy";

// Type styles
const typeStyles = (type, colors) => {
  switch (type?.toLowerCase()) {
    case "low stock":
      return { 
        color: colors.yellowAccent?.[400] || "#FFA726", 
        icon: <WarningIcon />,
        label: "Low Stock"
      };
    case "expiry":
      return { 
        color: colors.redAccent?.[400] || "#f44336", 
        icon: <EventBusyIcon />,
        label: "Expiry Alert"
      };
    case "warning":
      return { 
        color: colors.yellowAccent?.[400] || "#FFA726", 
        icon: <WarningIcon />,
        label: "Warning"
      };
    case "error":
      return { 
        color: colors.redAccent?.[400] || "#f44336", 
        icon: <ErrorIcon />,
        label: "Error"
      };
    case "success":
      return { 
        color: colors.greenAccent?.[400] || "#4caf50", 
        icon: <CheckCircleIcon />,
        label: "Success"
      };
    default:
      return { 
        color: colors.blueAccent?.[400] || "#2196f3", 
        icon: <InfoIcon />,
        label: "Info"
      };
  }
};

const Alerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const alertIdFromQuery = query.get("alertId");

  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [items, setItems] = useState({}); // Store items by ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------- FETCH ALERTS --------------------
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/alerts/");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAlerts(data);
        setError("");
        
        // Extract unique item IDs from alerts
        const itemIds = [...new Set(data.map(alert => alert.item_id).filter(Boolean))];
        
        if (itemIds.length > 0) {
          await fetchItems(itemIds);
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
        setError("Failed to load alerts. Please check if the server is running.");
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // -------------------- FETCH ITEMS --------------------
  const fetchItems = async (itemIds) => {
    try {
      // Fetch all items first
      const itemsResponse = await fetch("http://localhost:8000/items/");
      if (!itemsResponse.ok) {
        throw new Error(`HTTP error! status: ${itemsResponse.status}`);
      }
      
      const allItems = await itemsResponse.json();
      
      // Filter items to only those referenced in alerts
      const relevantItems = allItems.filter(item => itemIds.includes(item.id));
      
      // Create a mapping of item ID to item name
      const itemsMap = {};
      relevantItems.forEach(item => {
        itemsMap[item.id] = item.itemName;
      });
      
      setItems(itemsMap);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      // Don't set error here, just continue without item names
    }
  };

  // Expand specific alert if passed in query
  useEffect(() => {
    if (alertIdFromQuery) {
      setExpandedAlert(alertIdFromQuery);
    }
  }, [alertIdFromQuery]);

  const handleChange = (id) => (event, isExpanded) => {
    setExpandedAlert(isExpanded ? id : null);
  };

  // Get item name from item ID
  const getItemName = (itemId) => {
    return items[itemId] || "Unknown Item";
  };

  return (
    <Box m="20px">
      <Header title="Alerts" subtitle="Important Alerts and Notifications" />
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography>Loading alerts...</Typography>
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert) => {
            const { color, icon, label } = typeStyles(alert.type, colors);
            return (
              <Accordion
                key={alert.id}
                expanded={expandedAlert === alert.id}
                onChange={handleChange(alert.id)}
                sx={{ 
                  boxShadow: 3, 
                  borderRadius: 2,
                  borderLeft: `4px solid ${color}`
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {icon}
                    <Box>
                      <Typography variant="h6" sx={{ color, fontWeight: 'bold' }}>
                        {alert.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip
                          label={label}
                          size="small"
                          sx={{
                            backgroundColor: color,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: '20px'
                          }}
                        />
                        {alert.item_id && (
                          <Typography variant="body2" color="text.secondary">
                            • {getItemName(alert.item_id)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography paragraph sx={{ mb: 2 }}>
                    {alert.message}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {alert.item_id && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          Related to:
                        </Typography>
                        <Chip
                          label={getItemName(alert.item_id)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        Type:
                      </Typography>
                      <Chip
                        label={alert.type}
                        size="small"
                        sx={{
                          backgroundColor: color,
                          color: 'white'
                        }}
                      />
                    </Box>
                    {alert.item_id && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1 }}>
                        Item ID: {alert.item_id}
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
          {alerts.length === 0 && !loading && !error && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              height="200px"
              sx={{ color: 'text.secondary' }}
            >
              <InventoryIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6">No alerts found</Typography>
              <Typography variant="body2">Everything is running smoothly</Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Alerts;