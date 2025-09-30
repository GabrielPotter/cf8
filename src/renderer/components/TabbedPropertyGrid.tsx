import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Toolbar,
  Typography,
  Tooltip,
  IconButton,
  Alert,
  Stack,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { json} from "@codemirror/lang-json";

// Use only this import: PropertyGrid and JSONSchema come from here.
import { PropertyGrid, JSONSchema } from "./PropertyGrid";

export type TabbedPropertyGridProps = {
  /** Initial JSON data */
  data: any;
  /** Schema for the JSON */
  schema: JSONSchema;
  /** Read-only (PropertyGrid + editor are read-only) */
  readOnly?: boolean;
  /** Called when any content (data/schema) changes validly */
  onChange?: (next: { data: any; schema: JSONSchema }) => void;
  /** Optional: initial active tab */
  initialTab?: "grid" | "data" | "schema";
  /** Height; default: 100% */
  height?: string | number;
};

/**
 * Three-tab panel:
 *  - Property Grid: form view of data with schema
 *  - Data JSON Editor
 *  - Schema JSON Editor
 * Keeps all three views in sync and surfaces JSON errors clearly.
 *
 * SCROLL FIXES:
 *  - Wrap CodeMirror to 100% height and force .cm-editor to 100%.
 *  - .cm-scroller uses overflow:auto to enable both vertical and horizontal scroll.
 *  - Disable lineWrapping in basicSetup so long lines can scroll horizontally.
 */
const TabbedPropertyGrid: React.FC<TabbedPropertyGridProps> = ({
  data,
  schema,
  readOnly = false,
  onChange,
  initialTab = "grid",
  height = "100%",
}) => {
  type TabKey = "grid" | "data" | "schema";

  const [tab, setTab] = useState<TabKey>(initialTab);

  // Object state and its text (JSON) representation
  const [dataObj, setDataObj] = useState<any>(data);
  const [schemaObj, setSchemaObj] = useState<JSONSchema>(schema);
  const [dataText, setDataText] = useState<string>(() => pretty(data));
  const [schemaText, setSchemaText] = useState<string>(() => pretty(schema));

  // Editor errors
  const [dataError, setDataError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Track external prop changes (e.g. parent updates data/schema)
  useEffect(() => {
    setDataObj(data);
    setDataText(pretty(data));
  }, [data]);

  useEffect(() => {
    setSchemaObj(schema);
    setSchemaText(pretty(schema));
  }, [schema]);

  // Central onChange trigger so callers get updates
  const emitChange = useCallback(
    (nextData: any, nextSchema: JSONSchema) => {
      onChange?.({ data: nextData, schema: nextSchema });
    },
    [onChange]
  );

  // Edit Data JSON
  const handleDataTextChange = useCallback(
    (nextText: string) => {
      setDataText(nextText);
      try {
        const parsed = JSON.parse(nextText);
        setDataObj(parsed);
        setDataError(null);
        emitChange(parsed, schemaObj);
      } catch (err: any) {
        setDataError(err?.message ?? "Érvénytelen JSON");
      }
    },
    [schemaObj, emitChange]
  );

  // Edit Schema JSON
  const handleSchemaTextChange = useCallback(
    (nextText: string) => {
      setSchemaText(nextText);
      try {
        const parsed: JSONSchema = JSON.parse(nextText);
        setSchemaObj(parsed);
        setSchemaError(null);
        emitChange(dataObj, parsed);
      } catch (err: any) {
        setSchemaError(err?.message ?? "Érvénytelen JSON séma");
      }
    },
    [dataObj, emitChange]
  );

  // PropertyGrid changes (form edit)
  const handleGridChange = useCallback(
    (next: any) => {
      setDataObj(next);
      setDataText(pretty(next));
      setDataError(null);
      emitChange(next, schemaObj);
    },
    [schemaObj, emitChange]
  );

  // Toolbar actions
  const copyData = useCallback(() => navigator.clipboard?.writeText(dataText), [dataText]);
  const copySchema = useCallback(() => navigator.clipboard?.writeText(schemaText), [schemaText]);
  const prettyData = useCallback(() => setDataText(prettySafe(dataText)), [dataText]);
  const prettySchema = useCallback(() => setSchemaText(prettySafe(schemaText)), [schemaText]);
  const resetData = useCallback(() => {
    setDataObj(data);
    setDataText(pretty(data));
    setDataError(null);
  }, [data]);
  const resetSchema = useCallback(() => {
    setSchemaObj(schema);
    setSchemaText(pretty(schema));
    setSchemaError(null);
  }, [schema]);

  return (
    <Paper elevation={1} sx={{ display: "flex", flexDirection: "column", height, minHeight: 0 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Data / Schema / Grid tabs">
        <Tab value="grid" label="Property Grid" />
        <Tab value="data" label="Data (JSON)" />
        <Tab value="schema" label="Schema (JSON)" />
      </Tabs>

      {tab === "grid" && (
        <TabPanel>
          <Box sx={{ height: "100%", overflow: "auto", p: 1 }}>
            <PropertyGrid
              schema={schemaObj}
              value={dataObj}
              onChange={handleGridChange}
              readOnly={readOnly}
              indentStep={1}
            />
          </Box>
        </TabPanel>
      )}

      {tab === "data" && (
        <EditorPanel
          title="Data JSON"
          text={dataText}
          onTextChange={handleDataTextChange}
          error={dataError}
          onCopy={copyData}
          onPretty={prettyData}
          onReset={resetData}
          readOnly={readOnly}
        />
      )}

      {tab === "schema" && (
        <EditorPanel
          title="Schema JSON"
          text={schemaText}
          onTextChange={handleSchemaTextChange}
          error={schemaError}
          onCopy={copySchema}
          onPretty={prettySchema}
          onReset={resetSchema}
          readOnly={readOnly}
        />
      )}
    </Paper>
  );
};

export default TabbedPropertyGrid;

// === Helper components ===

const TabPanel: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <Box sx={{ flex: 1, minHeight: 0 /* important for CodeMirror sizing */ }}>
    {children}
  </Box>
);

type EditorPanelProps = {
  title: string;
  text: string;
  onTextChange: (t: string) => void;
  error: string | null;
  onCopy: () => void;
  onPretty: () => void;
  onReset: () => void;
  readOnly?: boolean;
};

const EditorPanel: React.FC<EditorPanelProps> = ({
  title,
  text,
  onTextChange,
  error,
  onCopy,
  onPretty,
  onReset,
  readOnly,
}) => {
  return (
    <TabPanel>
      <Stack sx={{ height: "100%" }}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Tooltip title="Pretty print">
            <span>
              <IconButton size="small" onClick={onPretty} disabled={readOnly}>
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Másolás vágólapra">
            <IconButton size="small" onClick={onCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vissza az eredetire">
            <span>
              <IconButton size="small" onClick={onReset} disabled={false}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>

        {/* SCROLL FIX: 100% wrapper height and allow the internal scroller to scroll */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            "& .cm-editor": { height: "100%" },
            "& .cm-scroller": { overflow: "auto" },
          }}
        >
          <CodeMirror
            height="100%"
            value={text}
            onChange={onTextChange}
            extensions={[json()]}
            theme={vscodeDark}
            basicSetup={{ lineNumbers: true }}
            editable={!readOnly}
            style={{ height: "100%" }}
          />
        </Box>

        {error && (
          <Box sx={{ p: 1 }}>
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          </Box>
        )}
      </Stack>
    </TabPanel>
  );
};

// === Helper functions ===
function pretty(value: any): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function prettySafe(currentText: string): string {
  try {
    const parsed = JSON.parse(currentText);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return currentText; // If JSON is invalid, leave it as-is.
  }
}
