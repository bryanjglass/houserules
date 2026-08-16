import { useState } from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { darculaTheme } from './theme';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { FileExplorer } from './components/FileExplorer';
import { EditorArea } from './components/EditorArea';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { ComponentGallery } from './components/ComponentGallery';
import { sampleCode } from './data/mockFiles';

const defaultOpenFiles = ['theme.ts', 'App.tsx', 'main.tsx'];

export default function App() {
  const [openFiles, setOpenFiles] = useState<string[]>(defaultOpenFiles);
  const [activeFile, setActiveFile] = useState<string>(defaultOpenFiles[0]);
  const [activityItem, setActivityItem] = useState('Project');
  const [showGallery, setShowGallery] = useState(false);

  const openFile = (name: string) => {
    if (!sampleCode[name]) return; // only files with mock content are "openable"
    setShowGallery(false);
    setOpenFiles((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setActiveFile(name);
  };

  const closeFile = (name: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f !== name);
      if (activeFile === name) {
        setActiveFile(next[next.length - 1] ?? '');
      }
      return next;
    });
  };

  return (
    <ThemeProvider theme={darculaTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <TitleBar />
        <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
          <ActivityBar
            active={activityItem}
            onSelect={(label) => {
              setActivityItem(label);
              setShowGallery(false);
            }}
            onGallery={() => setShowGallery(true)}
            galleryActive={showGallery}
          />
          <FileExplorer activeFile={activeFile} onSelectFile={openFile} />
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
            {showGallery ? (
              <ComponentGallery />
            ) : (
              <>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <EditorArea openFiles={openFiles} activeFile={activeFile} onSelect={setActiveFile} onClose={closeFile} />
                </Box>
                <BottomPanel />
              </>
            )}
          </Box>
        </Box>
        <StatusBar file={showGallery ? 'ComponentGallery.tsx' : activeFile || 'No file open'} />
      </Box>
    </ThemeProvider>
  );
}
