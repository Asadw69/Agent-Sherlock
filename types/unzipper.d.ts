// Minimal ambient typings for the small subset of `unzipper` this project
// actually uses. No official/DefinitelyTyped package is installed, and the
// full API surface isn't needed here - just enough for lib/file-handling.ts
// to type-check safely instead of falling back to implicit `any`.
declare module 'unzipper' {
  import { Duplex, Readable } from 'stream';

  export interface EntryVars {
    uncompressedSize?: number;
    compressedSize?: number;
    [key: string]: unknown;
  }

  export interface Entry extends Readable {
    path: string;
    type: 'File' | 'Directory';
    vars?: EntryVars;
    autodrain(): void;
  }

  export function Parse(): Duplex;

  const unzipper: {
    Parse: typeof Parse;
  };

  export default unzipper;
}
