// Converts the plain JSON-Schema-ish tool definitions used for Claude
// (lib/ai/tools.ts, lib/ai/schema.ts, lib/ai/fix-schema.ts) into Gemini's
// FunctionDeclaration/Schema shape, so both providers can share a single
// tool-schema source of truth instead of maintaining two copies by hand.

import { Type, type Schema, type FunctionDeclaration } from '@google/genai';

// Minimal shape of the JSON-Schema-ish objects our tool definitions use.
// Loosely typed (and readonly-tolerant) so the `as const` tool definitions
// in lib/ai/tools.ts, lib/ai/schema.ts, and lib/ai/fix-schema.ts can be
// passed in directly without re-typing them.
interface JsonSchemaLike {
  type: string;
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
  required?: readonly string[];
  enum?: readonly string[];
  description?: string;
}

interface ToolDefLike {
  name: string;
  description: string;
  input_schema: JsonSchemaLike;
}

const TYPE_MAP: Record<string, Type> = {
  object: Type.OBJECT,
  string: Type.STRING,
  number: Type.NUMBER,
  array: Type.ARRAY,
  boolean: Type.BOOLEAN,
};

function convertSchema(schema: JsonSchemaLike): Schema {
  const geminiType = TYPE_MAP[schema.type] ?? Type.STRING;

  const result: Schema = { type: geminiType };
  if (schema.description) result.description = schema.description;
  if (schema.enum) result.enum = [...schema.enum];

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, convertSchema(value)])
    );
  }
  if (schema.required && schema.required.length > 0) {
    result.required = [...schema.required];
  }
  if (schema.items) {
    result.items = convertSchema(schema.items);
  }

  return result;
}

export function toGeminiFunctionDeclaration(tool: ToolDefLike): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: convertSchema(tool.input_schema),
  };
}
