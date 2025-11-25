import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Members from "./scenes/members";
import Committee from "./scenes/committee";
import PlannedEvents from "./scenes/plannedEvents";
import Finance from "./scenes/finance";
import PastEvents from "./scenes/pastEvents";
import Forms from "./scenes/forms";
import Communication from "./scenes/communication";
import Analytics from "./scenes/analytics";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar/calendar";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar isSidebar={isSidebar} />
          <main className="content">
            <Topbar setIsSidebar={setIsSidebar} />
            <Routes>
              <Route path="/" element={<Dashboard />} />

              {/* People section */}
              <Route path="/people">
                <Route path="members" element={<Members />} />
                <Route path="committee" element={<Committee />} />
              </Route>

              <Route path="/events">
                <Route path="plannedEvents" element={<PlannedEvents />} />
                <Route path="forms" element={<Forms />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="pastEvents" element={<PastEvents />} />
              </Route>

              <Route path="/finance" element={<Finance />} />
              <Route path="/communication" element={<Communication />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;