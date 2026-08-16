import { Box, Stack, Typography } from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

interface StatusBarProps {
  file: string;
  line?: number;
  column?: number;
}

export function StatusBar({ file, line = 1, column = 1 }: StatusBarProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        height: 22,
        px: 1,
        backgroundColor: 'primary.dark',
        color: 'primary.contrastText',
        fontSize: '0.6875rem',
      }}
      spacing={1.5}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <AccountTreeOutlinedIcon sx={{ fontSize: 13 }} />
        <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
          main
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 13 }} />
        <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
          No problems
        </Typography>
      </Stack>

      <Box sx={{ flexGrow: 1 }} />

      <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
        {file}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
        Ln {line}, Col {column}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
        UTF-8
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'inherit' }}>
        TypeScript
      </Typography>
    </Stack>
  );
}
