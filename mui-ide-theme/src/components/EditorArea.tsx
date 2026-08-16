import { Box, Tabs, Tab, IconButton, Stack } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { CodeView } from './CodeView';
import { sampleCode } from '../data/mockFiles';

interface EditorAreaProps {
  openFiles: string[];
  activeFile: string;
  onSelect: (name: string) => void;
  onClose: (name: string) => void;
}

export function EditorArea({ openFiles, activeFile, onSelect, onClose }: EditorAreaProps) {
  const activeIndex = Math.max(openFiles.indexOf(activeFile), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <Tabs
        value={activeIndex}
        onChange={(_, i) => onSelect(openFiles[i])}
        variant="scrollable"
        scrollButtons={false}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 30 }}
      >
        {openFiles.map((name) => (
          <Tab
            key={name}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <DescriptionOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <span>{name}</span>
                <IconButton
                  component="span"
                  size="small"
                  sx={{ p: 0.25, ml: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(name);
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Stack>
            }
          />
        ))}
      </Tabs>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <CodeView lines={sampleCode[activeFile] ?? []} />
      </Box>
    </Box>
  );
}
