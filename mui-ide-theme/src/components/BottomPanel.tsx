import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Stack } from '@mui/material';

const terminalLines = [
  { prompt: '~/mui-ide-theme', cmd: 'npm run dev' },
  { text: '  VITE v5.2.12  ready in 312 ms', color: 'success.main' as const },
  { text: '' },
  { text: '  ➜  Local:   http://localhost:5174/', color: 'text.secondary' as const },
  { text: '  ➜  Network: use --host to expose', color: 'text.disabled' as const },
];

const problems = [
  { file: 'theme.ts', line: 42, severity: 'warning', message: "Unused variable 'accentBlueBright'" },
  { file: 'EditorArea.tsx', line: 18, severity: 'info', message: 'Prefer const over let' },
];

export function BottomPanel() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ height: 180, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 28, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Terminal" sx={{ minHeight: 28 }} />
        <Tab label={`Problems (${problems.length})`} sx={{ minHeight: 28 }} />
        <Tab label="Output" sx={{ minHeight: 28 }} />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1, backgroundColor: 'background.default' }}>
        {tab === 0 && (
          <Stack spacing={0.25} sx={{ fontFamily: 'inherit', fontSize: '0.75rem' }}>
            {terminalLines.map((line, i) =>
              'cmd' in line ? (
                <Typography key={i} variant="caption" component="div" sx={{ fontFamily: 'inherit' }}>
                  <Box component="span" sx={{ color: 'primary.light' }}>
                    {line.prompt}
                  </Box>
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {' $ '}
                  </Box>
                  <Box component="span" sx={{ color: 'text.primary' }}>
                    {line.cmd}
                  </Box>
                </Typography>
              ) : (
                <Typography key={i} variant="caption" component="div" sx={{ fontFamily: 'inherit', color: line.color ?? 'text.secondary' }}>
                  {line.text || ' '}
                </Typography>
              ),
            )}
            <Typography variant="caption" component="div" sx={{ color: 'text.primary' }}>
              <Box component="span" sx={{ color: 'primary.light' }}>
                ~/mui-ide-theme
              </Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {' $ '}
              </Box>
              <Box component="span" sx={{ borderRight: '1px solid', borderColor: 'text.primary', animation: 'blink 1s step-end infinite' }}>
                &nbsp;
              </Box>
            </Typography>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={0.5}>
            {problems.map((p, i) => (
              <Typography key={i} variant="caption" component="div">
                <Box
                  component="span"
                  sx={{ color: p.severity === 'warning' ? 'warning.main' : 'info.main', fontWeight: 600, mr: 0.5 }}
                >
                  {p.severity === 'warning' ? '⚠' : 'ⓘ'}
                </Box>
                <Box component="span" sx={{ color: 'text.primary' }}>
                  {p.message}
                </Box>
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {'  '}
                  {p.file}:{p.line}
                </Box>
              </Typography>
            ))}
          </Stack>
        )}

        {tab === 2 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Build finished. 0 errors, {problems.length} warnings.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
