import { Stack, IconButton, Tooltip, Box } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';

const items = [
  { icon: FolderOutlinedIcon, label: 'Project' },
  { icon: SearchRoundedIcon, label: 'Search' },
  { icon: AccountTreeOutlinedIcon, label: 'Git' },
  { icon: ExtensionOutlinedIcon, label: 'Extensions' },
];

interface ActivityBarProps {
  active: string;
  onSelect: (label: string) => void;
  onGallery: () => void;
  galleryActive: boolean;
}

export function ActivityBar({ active, onSelect, onGallery, galleryActive }: ActivityBarProps) {
  return (
    <Stack
      sx={{
        width: 40,
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        py: 0.5,
      }}
      alignItems="center"
      justifyContent="space-between"
      height="100%"
    >
      <Stack alignItems="center" spacing={0.5}>
        {items.map(({ icon: Icon, label }) => (
          <Tooltip key={label} title={label} placement="right">
            <IconButton
              onClick={() => onSelect(label)}
              sx={{
                borderRadius: 0.5,
                color: active === label ? 'primary.light' : 'text.disabled',
                backgroundColor: active === label ? 'action.selected' : 'transparent',
              }}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        ))}
      </Stack>

      <Stack alignItems="center" spacing={0.5}>
        <Tooltip title="Component Gallery" placement="right">
          <IconButton
            onClick={onGallery}
            sx={{
              borderRadius: 0.5,
              color: galleryActive ? 'primary.light' : 'text.disabled',
              backgroundColor: galleryActive ? 'action.selected' : 'transparent',
            }}
          >
            <WidgetsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ height: 4 }} />
      </Stack>
    </Stack>
  );
}
