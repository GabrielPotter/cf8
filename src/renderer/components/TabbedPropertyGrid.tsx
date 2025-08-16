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

// KIZÁRÓLAG EZT AZ IMPORTOT HASZNÁLJUK: a PropertyGrid és a JSONSchema típust innen vesszük
import { PropertyGrid, JSONSchema } from "./PropertyGrid";

export type TabbedPropertyGridProps = {
  /** Kezdő JSON adat */
  data: any;
  /** A JSON-hoz tartozó séma */
  schema: JSONSchema;
  /** Csak olvasás (PropertyGrid + Editor is read-only) */
  readOnly?: boolean;
  /** Akkor hívjuk, ha bármelyik tartalom (data/schema) érvényesen megváltozott */
  onChange?: (next: { data: any; schema: JSONSchema }) => void;
  /** Opcionális: kezdeti aktív fül */
  initialTab?: "grid" | "data" | "schema";
  /** Magasság; alapértelmezés: 100% */
  height?: string | number;
};

/**
 * Háromfüles panel:
 *  - Property Grid: az adat űrlapos nézete a sémával
 *  - Data JSON Editor
 *  - Schema JSON Editor
 * A komponens szinkronban tartja a három nézetet, és JSON hibákat barátságosan jelzi.
 *
 * SCROLL FIXEK:
 *  - A CodeMirror köré tettünk egy wrappert, ami 100% magasságú, és a belső .cm-editor-t is 100%-ra húzza.
 *  - A .cm-scroller kifejezetten overflow:auto, így mind vertikális, mind horizontális scroll működik.
 *  - A basicSetup-ben a lineWrapping: false, hogy legyen vízszintes scrollbar hosszú soroknál.
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

  // Objektum állapot és a hozzá tartozó szöveges (JSON) reprezentáció
  const [dataObj, setDataObj] = useState<any>(data);
  const [schemaObj, setSchemaObj] = useState<JSONSchema>(schema);
  const [dataText, setDataText] = useState<string>(() => pretty(data));
  const [schemaText, setSchemaText] = useState<string>(() => pretty(schema));

  // Hibák az editorokhoz
  const [dataError, setDataError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Külső prop-változás követése (pl. szülő frissíti a data/scheme-et)
  useEffect(() => {
    setDataObj(data);
    setDataText(pretty(data));
  }, [data]);

  useEffect(() => {
    setSchemaObj(schema);
    setSchemaText(pretty(schema));
  }, [schema]);

  // onChange trigger egy helyen, hogy a hívó fél is értesüljön
  const emitChange = useCallback(
    (nextData: any, nextSchema: JSONSchema) => {
      onChange?.({ data: nextData, schema: nextSchema });
    },
    [onChange]
  );

  // Data JSON szerkesztése
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

  // Schema JSON szerkesztése
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

  // PropertyGrid változás (form szerkesztés)
  const handleGridChange = useCallback(
    (next: any) => {
      setDataObj(next);
      setDataText(pretty(next));
      setDataError(null);
      emitChange(next, schemaObj);
    },
    [schemaObj, emitChange]
  );

  // Eszköztár akciók
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

// === Segéd komponensek ===

const TabPanel: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <Box sx={{ flex: 1, minHeight: 0 /* fontos: hogy a CodeMirror jól méretezzen */ }}>
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

        {/* SCROLL FIX: a wrappert 100%-ra húzzuk, és a CodeMirror belső scrollerét engedjük görgetni */}
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

// === segéd függvények ===
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
    return currentText; // ha nem érvényes JSON, nem bántjuk
  }
}
