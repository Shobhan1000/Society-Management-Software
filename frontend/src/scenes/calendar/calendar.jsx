import { useState, useEffect, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { formatDate } from "@fullcalendar/core";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const calendarRef = useRef(null);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, []);

  // Initialize calendar after component mounts
  useEffect(() => {
    if (calendarRef.current && !loading) {
      initializeCalendar();
    }
  }, [events, loading]);

  const initializeCalendar = async () => {
    try {
      // Dynamically import FullCalendar to avoid SSR issues
      const { Calendar } = await import('@fullcalendar/core');
      const dayGridPlugin = await import('@fullcalendar/daygrid');
      const timeGridPlugin = await import('@fullcalendar/timegrid');
      const interactionPlugin = await import('@fullcalendar/interaction');
      const listPlugin = await import('@fullcalendar/list');
      
      if (calendarRef.current) {
        const calendar = new Calendar(calendarRef.current, {
          plugins: [
            dayGridPlugin.default,
            timeGridPlugin.default,
            interactionPlugin.default,
            listPlugin.default
          ],
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
          },
          initialView: "dayGridMonth",
          selectable: true,
          events: events,
          eventClick: handleEventClick,
          select: handleDateSelect,
          eventDisplay: "block",
          eventColor: colors.blueAccent[500],
          eventTextColor: colors.grey[100],
          height: "70vh"
        });
        
        calendar.render();
        
        // Cleanup function
        return () => {
          calendar.destroy();
        };
      }
    } catch (err) {
      console.error("Failed to initialize calendar:", err);
      setError("Failed to initialize calendar. Please check your dependencies.");
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/events/");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Transform data to FullCalendar format
      const formattedEvents = data.map(event => ({
        id: event.id, // Keep as UUID string
        title: event.title,
        start: event.date,
        end: event.date,
        allDay: true,
        extendedProps: {
          description: event.description
        }
      }));
      
      setEvents(formattedEvents);
      setError("");
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please check if the server is running.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date select
  const handleDateSelect = (selectInfo) => {
    setNewEvent({
      title: "",
      description: "",
      date: selectInfo.startStr
    });
    setOpenDialog(true);
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    if (window.confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'?`)) {
      handleDeleteEvent(clickInfo.event.id);
    }
  };

  // Create new event
  const handleCreateEvent = async () => {
    try {
      const response = await fetch("http://localhost:8000/events/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      setSnackbar({ open: true, message: "Event created successfully!", severity: "success" });
      setOpenDialog(false);
      fetchEvents(); // Refresh events list
    } catch (err) {
      console.error("Error creating event:", err);
      setSnackbar({ open: true, message: "Failed to create event", severity: "error" });
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:8000/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setSnackbar({ open: true, message: "Event deleted successfully!", severity: "success" });
      fetchEvents(); // Refresh events list
    } catch (err) {
      console.error("Error deleting event:", err);
      setSnackbar({ open: true, message: "Failed to delete event", severity: "error" });
    }
  };

  // Format UUID for display (show first 8 characters for brevity)
  const formatUUID = (uuid) => {
    if (!uuid) return "N/A";
    return uuid.substring(0, 8) + "...";
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Interactive Event Calendar" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" gap={2}>
        {/* Sidebar */}
        <Box
          flex="1 1 25%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
          minWidth="250px"
        >
          <Typography variant="h5" sx={{ mb: 2, color: colors.grey[100] }}>
            Upcoming Events
          </Typography>
          <List>
            {events.slice(0, 5).map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  margin: "10px 0",
                  borderRadius: "4px",
                  '&:hover': {
                    backgroundColor: colors.greenAccent[600],
                  }
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: colors.grey[100] }}>
                        {formatDate(event.start, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.grey[300], fontSize: '0.7rem' }}>
                        ID: {formatUUID(event.id)}
                      </Typography>
                    </Box>
                  }
                />
                <Button
                  size="small"
                  onClick={() => handleDeleteEvent(event.id)}
                  sx={{ color: colors.grey[100], minWidth: 'auto' }}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              </ListItem>
            ))}
            {events.length === 0 && !loading && (
              <Typography variant="body2" sx={{ color: colors.grey[300], textAlign: 'center', mt: 2 }}>
                No events scheduled
              </Typography>
            )}
          </List>
        </Box>

        {/* Calendar */}
        <Box flex="1 1 75%" sx={{ minHeight: '70vh' }}>
          <div ref={calendarRef}></div>
          {loading && (
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
              Loading calendar...
            </Typography>
          )}
        </Box>
      </Box>

      {/* Add Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title"
            fullWidth
            variant="outlined"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Date: {newEvent.date}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            disabled={!newEvent.title.trim()}
            startIcon={<AddIcon />}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Calendar;