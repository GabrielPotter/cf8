import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import HubIcon from "@mui/icons-material/Hub";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircle from "@mui/icons-material/AccountCircle"
import TuneIcon from "@mui/icons-material/Tune";
import type { ViewId } from "../../shared/types"

type Item = { id: ViewId; label: string; icon: React.ReactNode };

const TOP_ITEMS: Item[] = [
  { id: "explorer", label: "Explorer", icon: <FolderIcon /> },
  { id: "flow", label: "Flow", icon: <HubIcon /> },
  { id: "logs", label: "Logs", icon: <ListAltIcon /> },
  { id: "props", label: "Property Grid", icon: <TuneIcon /> },
];

const BOTTOM_ITEMS: Item[] = [
  { id: "account", label: "user account", icon: <AccountCircle/>},
  { id: "settings", label: "Settings", icon: <SettingsIcon /> }
];

export interface ActivityBarProps {
  active: ViewId;
  onSelect: (id: ViewId) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ active, onSelect }) => {
  return (
    <Box className="activity-bar">
      {TOP_ITEMS.map((it) => (
        <Tooltip key={it.id} title={it.label} placement="right">
          <IconButton
            size="large"
            color={active === it.id ? "primary" : "inherit"}
            onClick={() => onSelect(it.id)}
          >
            {it.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Box className="activity-bar-bottom">
        {BOTTOM_ITEMS.map((it) => (
          <Tooltip key={it.id} title={it.label} placement="right">
            <IconButton
              size="large"
              color={active === it.id ? "primary" : "inherit"}
              onClick={() => onSelect(it.id)}
            >
              {it.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};
