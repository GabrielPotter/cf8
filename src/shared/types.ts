export type ViewId = "explorer" | "flow" | "logs" | "settings" | "props";

export interface CatalogNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: CatalogNode[];
  size?: number;
  mtimeMs?: number;
}

export interface Api {
  getVersion(): Promise<string>;
  scanCatalog(rootPath: string): Promise<CatalogNode>;
  readJsonFromData(fileName: string): Promise<any>;
}

/** Egyszerűsített JSON Schema (PG induló verzióhoz) */
export type JSONSchema =
  | JSONSchemaObject
  | JSONSchemaString
  | JSONSchemaNumber
  | JSONSchemaBoolean
  | JSONSchemaArray;

export interface JSONSchemaBase {
  title?: string;
  description?: string;
}

export interface JSONSchemaObject extends JSONSchemaBase {
  type: "object";
  properties: Record<string, JSONSchema>;
  required?: string[];
}

export interface JSONSchemaString extends JSONSchemaBase {
  type: "string";
  enum?: string[];
  minLength?: number;
  maxLength?: number;
}

export interface JSONSchemaNumber extends JSONSchemaBase {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
}

export interface JSONSchemaBoolean extends JSONSchemaBase {
  type: "boolean";
}

export interface JSONSchemaArray extends JSONSchemaBase {
  type: "array";
  items: JSONSchema;
}