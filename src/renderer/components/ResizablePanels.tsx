import React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export const ResizableColumns: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  leftDefaultSize?: number;
}> = ({ left, right, leftDefaultSize = 25 }) => {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={leftDefaultSize} minSize={10}>
        {left}
      </Panel>
      <PanelResizeHandle style={{ width: 4, background: "#2d2d2d", cursor: "col-resize" }} />
      <Panel minSize={20}>{right}</Panel>
    </PanelGroup>
  );
};
