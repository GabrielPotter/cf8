import React from "react";
import { Box } from "@mui/material";
import { ActivityBar } from "./components/ActivityBar";
import { ViewStack } from "./components/ViewStack";
import ExplorerView from "./views/ExplorerView";
import FlowView from "./views/FlowView";
import LogsView from "./views/LogsView";
import SettingsView from "./views/SettingsView";
import PropsTestView from "./views/PropsTestView";
import type { ViewId } from "@/shared/types";
import ErrorBoundary from "./components/ErrorBoundary";
import DiagramTestView from "./views/DiagramTestView";

const App: React.FC = () => {
  const [active, setActive] = React.useState<ViewId>("explorer");

  return (
    <ErrorBoundary>
      <div id="app-root">
        <ActivityBar active={active} onSelect={setActive} />
        <Box className="view-area">
          <ViewStack<ViewId>
            activeId={active}
            children={[
              { id: "explorer", node: <ExplorerView /> },
              { id: "flow", node: <FlowView /> },
              { id: "logs", node: <LogsView /> },
              { id: "settings", node: <SettingsView /> },
              { id: "props", node: <DiagramTestView /> }
            ]}
          />
        </Box>
      </div>
    </ErrorBoundary>
  );
};

export default App;
