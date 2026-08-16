import { useState, type MouseEvent } from 'react';
import {
  AppBar,
  Toolbar,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  InputBase,
  Box,
  Tooltip,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const menus = ['File', 'Edit', 'View', 'Navigate', 'Refactor', 'Build', 'Run', 'Help'];

export function TitleBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>, menu: string) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(menu);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  return (
    <AppBar position="static" color="default">
      <Toolbar variant="dense" disableGutters sx={{ px: 1, gap: 1 }}>
        <Typography variant="subtitle2" sx={{ pr: 1, color: 'text.primary', whiteSpace: 'nowrap' }}>
          mui-ide-theme
        </Typography>

        <Stack direction="row" spacing={0.25}>
          {menus.map((menu) => (
            <Typography
              key={menu}
              component="button"
              onClick={(e) => handleOpen(e, menu)}
              variant="body2"
              sx={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                fontFamily: 'inherit',
                '&:hover': { backgroundColor: 'action.hover', color: 'text.primary' },
              }}
            >
              {menu}
            </Typography>
          ))}
        </Stack>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={handleClose}>{openMenu === 'File' ? 'New File…' : 'Action 1'}</MenuItem>
          <MenuItem onClick={handleClose}>{openMenu === 'File' ? 'Open…' : 'Action 2'}</MenuItem>
          <MenuItem onClick={handleClose}>{openMenu === 'File' ? 'Save All' : 'Action 3'}</MenuItem>
        </Menu>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Run 'App'">
            <IconButton size="small" sx={{ color: 'success.main' }}>
              <PlayArrowRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Debug 'App'">
            <IconButton size="small" sx={{ color: 'info.main' }}>
              <BugReportOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.75,
            px: 1,
            ml: 1,
            width: 220,
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
          <InputBase
            placeholder="Search Everywhere"
            sx={{ fontSize: '0.75rem', color: 'text.secondary', width: '100%' }}
          />
        </Box>

        <Stack direction="row" spacing={0.25} sx={{ ml: 1 }}>
          <IconButton size="small">
            <NotificationsNoneRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
