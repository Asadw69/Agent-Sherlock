import { describe, it, expect } from 'vitest';
import { Type } from '@google/genai';
import { toGeminiFunctionDeclaration } from './schema-convert';
import { TOOL_DEFINITIONS } from '../tools';
import { SUBMIT_RESULT_TOOL } from '../schema';
import { RECOMMENDED_FIX_TOOL } from '../fix-schema';

describe('toGeminiFunctionDeclaration', () => {
  it('converts every real investigation tool definition without throwing', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const decl = toGeminiFunctionDeclaration(tool);
      expect(decl.name).toBe(tool.name);
      expect(decl.parameters?.type).toBe(Type.OBJECT);
    }
  });

  it('converts the submit_investigation_result tool, preserving nested array-of-object schemas', () => {
    const decl = toGeminiFunctionDeclaration(SUBMIT_RESULT_TOOL);
    expect(decl.name).toBe('submit_investigation_result');
    expect(decl.parameters?.properties?.evidence?.type).toBe(Type.ARRAY);
    expect(decl.parameters?.properties?.evidence?.items?.type).toBe(Type.OBJECT);
    expect(decl.parameters?.properties?.evidence?.items?.properties?.strength?.type).toBe(Type.STRING);
    expect(decl.parameters?.required).toContain('rootCause');
  });

  it('converts the recommended-fix tool', () => {
    const decl = toGeminiFunctionDeclaration(RECOMMENDED_FIX_TOOL);
    expect(decl.name).toBe('submit_recommended_fix');
    expect(decl.parameters?.required).toContain('immediateAction');
    expect(decl.parameters?.properties?.relatedEvidence?.type).toBe(Type.ARRAY);
  });

  it('preserves enum values on nested string fields', () => {
    const decl = toGeminiFunctionDeclaration(SUBMIT_RESULT_TOOL);
    const strengthEnum = decl.parameters?.properties?.evidence?.items?.properties?.strength?.enum;
    expect(strengthEnum).toEqual(['WEAK', 'STRONG', 'CONFIRMED']);
  });
});
