import { useState, type ReactNode } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Slider,
  Chip,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Divider,
  Paper,
  LinearProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

const rows = [
  { name: 'build.gradle', status: 'Modified', size: '2.1 KB' },
  { name: 'AndroidManifest.xml', status: 'Committed', size: '4.4 KB' },
  { name: 'MainActivity.kt', status: 'Untracked', size: '1.2 KB' },
];

export function ComponentGallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [radioValue, setRadioValue] = useState('a');
  const [sliderValue, setSliderValue] = useState(40);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Component Gallery
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Every control below reads from the Darcula theme — no per-component color overrides.
      </Typography>

      <Stack spacing={3}>
        <Section title="Buttons">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Button variant="contained" startIcon={<PlayArrowRoundedIcon />}>
              Run
            </Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
            <Button variant="contained" color="error" startIcon={<DeleteOutlineRoundedIcon />}>
              Delete
            </Button>
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <NotificationsNoneRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Button variant="outlined" onClick={() => setDialogOpen(true)}>
              Open Dialog
            </Button>
          </Stack>
        </Section>

        <Section title="Inputs">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <TextField label="Class name" defaultValue="MainActivity" />
            <Select defaultValue="kt" sx={{ minWidth: 160 }}>
              <MenuItem value="kt">Kotlin</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="ts">TypeScript</MenuItem>
            </Select>
          </Stack>
        </Section>

        <Section title="Selection controls">
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControlLabel control={<Checkbox defaultChecked />} label="Auto-import" />
            <FormControlLabel control={<Switch checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />} label="Live templates" />
            <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
              <FormControlLabel value="a" control={<Radio />} label="Spaces" />
              <FormControlLabel value="b" control={<Radio />} label="Tabs" />
            </RadioGroup>
          </Stack>
          <Box sx={{ maxWidth: 320, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Font size: {sliderValue}
            </Typography>
            <Slider size="small" value={sliderValue} onChange={(_, v) => setSliderValue(v as number)} min={8} max={24} />
          </Box>
        </Section>

        <Section title="Feedback">
          <Stack spacing={1}>
            <Alert severity="success">Build finished successfully.</Alert>
            <Alert severity="warning">3 deprecated API usages found.</Alert>
            <Alert severity="error">Gradle sync failed.</Alert>
            <LinearProgress variant="determinate" value={64} />
          </Stack>
        </Section>

        <Section title="Tags & status">
          <Stack direction="row" spacing={1}>
            <Chip label="main" color="primary" />
            <Chip label="feature/theme" variant="outlined" />
            <Chip label="Deprecated" color="warning" />
            <Chip label="Error" color="error" />
          </Stack>
        </Section>

        <Section title="Table">
          <Paper variant="outlined" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name} hover>
                    <TableCell sx={{ fontFamily: 'inherit' }}>{row.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        color={row.status === 'Modified' ? 'warning' : row.status === 'Untracked' ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{row.size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Section>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Run Configuration</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <Typography variant="body2" color="text.secondary">
            This dialog demonstrates MuiDialog paper styling from the theme — square corners, Darcula
            surface color, thin border, no drop-shadow gradient.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Run
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
        {title}
      </Typography>
      {children}
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
