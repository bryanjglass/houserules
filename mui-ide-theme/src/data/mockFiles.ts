export interface FileNode {
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  language?: 'ts' | 'json' | 'md';
}

export const fileTree: FileNode = {
  name: 'mui-ide-theme',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'ActivityBar.tsx', type: 'file', language: 'ts' },
            { name: 'BottomPanel.tsx', type: 'file', language: 'ts' },
            { name: 'EditorArea.tsx', type: 'file', language: 'ts' },
          ],
        },
        { name: 'theme.ts', type: 'file', language: 'ts' },
        { name: 'App.tsx', type: 'file', language: 'ts' },
        { name: 'main.tsx', type: 'file', language: 'ts' },
      ],
    },
    { name: 'package.json', type: 'file', language: 'json' },
    { name: 'README.md', type: 'file', language: 'md' },
  ],
};

export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'comment'
  | 'variable'
  | 'class'
  | 'operator'
  | 'punctuation'
  | 'plain';

export interface Token {
  text: string;
  kind: TokenKind;
}

export type CodeLine = Token[];

export const sampleCode: Record<string, CodeLine[]> = {
  'theme.ts': [
    [{ text: 'import', kind: 'keyword' }, { text: ' { ', kind: 'punctuation' }, { text: 'createTheme', kind: 'function' }, { text: ' } ', kind: 'punctuation' }, { text: 'from', kind: 'keyword' }, { text: " '@mui/material/styles';", kind: 'string' }],
    [],
    [{ text: 'export', kind: 'keyword' }, { text: ' const ', kind: 'keyword' }, { text: 'darculaTheme', kind: 'variable' }, { text: ' = ', kind: 'operator' }, { text: 'createTheme', kind: 'function' }, { text: '({', kind: 'punctuation' }],
    [{ text: '  spacing', kind: 'variable' }, { text: ': ', kind: 'punctuation' }, { text: '4', kind: 'number' }, { text: ',', kind: 'punctuation' }, { text: ' // condensed for desktop density', kind: 'comment' }],
    [{ text: '  palette', kind: 'variable' }, { text: ': {', kind: 'punctuation' }],
    [{ text: '    mode', kind: 'variable' }, { text: ': ', kind: 'punctuation' }, { text: "'dark'", kind: 'string' }, { text: ',', kind: 'punctuation' }],
    [{ text: '    background', kind: 'variable' }, { text: ': { ', kind: 'punctuation' }, { text: 'default', kind: 'variable' }, { text: ': ', kind: 'punctuation' }, { text: "'#2B2B2B'", kind: 'string' }, { text: ' },', kind: 'punctuation' }],
    [{ text: '  },', kind: 'punctuation' }],
    [{ text: '});', kind: 'punctuation' }],
  ],
  'App.tsx': [
    [{ text: 'function', kind: 'keyword' }, { text: ' ', kind: 'plain' }, { text: 'App', kind: 'class' }, { text: '() {', kind: 'punctuation' }],
    [{ text: '  return', kind: 'keyword' }, { text: ' (', kind: 'punctuation' }],
    [{ text: '    <ThemeProvider', kind: 'class' }, { text: ' theme', kind: 'variable' }, { text: '={', kind: 'punctuation' }, { text: 'darculaTheme', kind: 'variable' }, { text: '}>', kind: 'punctuation' }],
    [{ text: '      <IdeShell', kind: 'class' }, { text: ' />', kind: 'punctuation' }],
    [{ text: '    </ThemeProvider>', kind: 'class' }],
    [{ text: '  );', kind: 'punctuation' }],
    [{ text: '}', kind: 'punctuation' }],
  ],
  'main.tsx': [
    [{ text: 'import', kind: 'keyword' }, { text: " React from 'react';", kind: 'string' }],
    [{ text: 'import', kind: 'keyword' }, { text: " ReactDOM from 'react-dom/client';", kind: 'string' }],
    [],
    [{ text: '// entrypoint — mounts <App /> into #root', kind: 'comment' }],
    [{ text: 'ReactDOM', kind: 'variable' }, { text: '.', kind: 'punctuation' }, { text: 'createRoot', kind: 'function' }, { text: '(', kind: 'punctuation' }, { text: 'document', kind: 'variable' }, { text: '.', kind: 'punctuation' }, { text: 'getElementById', kind: 'function' }, { text: "('root')!).render(<App />);", kind: 'string' }],
  ],
};
