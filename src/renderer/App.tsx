import React, { useEffect, useState } from "react";
import { useSnackbar, type VariantType } from "notistack";
import { IconButton, Box } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "../ipc/ipc.d";
import theme from "./theme";
import SettingsView from "./views/SettingsView";
import LogsView from "./views/LogsView";
import AboutView from "./views/AboutView"
import AccountView from "./views/AccountView";
import ExplorerView from "./views/ExplorerView";
import { rendererLog } from "./logger";

type ViewKey = "workspace" |"explorer"| "logs" | "settings" | "about"|"account";

const WorkspaceContent: React.FC = () => (
    <PanelGroup direction="horizontal" style={{ height: "100%" }}>
        <Panel defaultSize={30} minSize={20}>
            <Box sx={{ backgroundColor: "#295dceff", height: "100%" }} className="panel-left">
                Left
            </Box>
        </Panel>
        <PanelResizeHandle className="handle" style={{ width: "5px", background: theme.palette.divider }} />
        <Panel minSize={30}>
            <Box sx={{ backgroundColor: "#62ca78ff", height: "100%" }} className="panel-mid">
                Mid
            </Box>
        </Panel>
        <PanelResizeHandle className="handle" style={{ width: "5px", background: theme.palette.grey[300] }} />
        <Panel defaultSize={30} minSize={20}>
            <div className="panel-right">Right</div>
        </Panel>
    </PanelGroup>
);



export const App: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [activeView, setActiveView] = useState<ViewKey>("workspace");

    useEffect(() => {
        window.api.workerMessage((event, payload) => {
            // console.log("...>", event, payload);
            enqueueSnackbar(`This is a success message: ${payload}`, { variant: event as VariantType });
        });
    }, []);

    const handleSelectView = (view: ViewKey) => {
        setActiveView(view);
        void rendererLog.info(`View switched to ${view}`);
    };
    const views: Record<ViewKey, React.ReactNode> = {
        workspace: <WorkspaceContent />,
        logs: <LogsView />,
        settings: <SettingsView />,
        about: <AboutView />,
        account: <AccountView/>,
        explorer:<ExplorerView/>
    };

    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
            <Box
                sx={{
                    width: 40,
                    minWidth: 40,
                    maxWidth: 40,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}
            >
                <IconButton color={activeView === "workspace" ? "primary" : "default"} onClick={() => handleSelectView("workspace")}>
                    <HomeIcon />
                </IconButton>
                <IconButton color={activeView === "workspace" ? "primary" : "default"} onClick={() => handleSelectView("explorer")}>
                    <HomeIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton color={activeView === "logs" ? "primary" : "default"} onClick={() => handleSelectView("account")}>
                    <PersonIcon />
                </IconButton>
                <IconButton color={activeView === "logs" ? "primary" : "default"} onClick={() => handleSelectView("logs")}>
                    <ArticleIcon />
                </IconButton>
                <IconButton color={activeView === "settings" ? "primary" : "default"} onClick={() => handleSelectView("settings")}>
                    <SettingsIcon />
                </IconButton>
                <IconButton color={activeView === "about" ? "primary" : "default"} onClick={() => handleSelectView("about")}>
                    <InfoIcon />
                </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>
                {(Object.keys(views) as ViewKey[]).map((viewKey) => (
                    <Box
                        key={viewKey}
                        sx={{
                            display: activeView === viewKey ? "block" : "none",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        {views[viewKey]}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
