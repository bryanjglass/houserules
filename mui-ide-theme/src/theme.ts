import { createTheme, alpha } from '@mui/material/styles';
import type { Theme, ThemeOptions } from '@mui/material/styles';

/**
 * Darcula palette values, lifted from IntelliJ IDEA's default dark scheme.
 * Kept as a standalone const (rather than inlined) so editor token colors
 * below can reference the same source of truth as the MUI palette.
 */
export const darcula = {
  bg: '#2B2B2B', // editor / main canvas background
  bgElevated: '#3C3F41', // toolbars, panels, sidebars, menus
  bgSunken: '#252526', // tool windows, terminal, tree background
  bgHover: '#3C3F41',
  border: '#323232',
  borderLight: '#4B4B4B',
  gutter: '#313335',
  selection: '#214283', // classic Darcula selection blue
  selectionInactive: '#3C4048',
  caretLine: '#323232',

  text: '#A9B7C6',
  textDim: '#808080',
  textDisabled: '#5C5C5C',
  textBright: '#FFFFFF',

  accentBlue: '#4A88C7', // links, focus rings, selected tab underline
  accentBlueBright: '#589DF6',
  orange: '#CC7832', // keywords
  green: '#6A8759', // strings
  blue: '#6897BB', // numbers
  yellow: '#FFC66D', // function / method names
  purple: '#9876AA', // keywords (this/super), annotations
  gray: '#808080', // comments
  red: '#FF6B68', // errors
  warnYellow: '#BBB529', // warnings

  gutterActive: '#A4A3A3',
} as const;

// ---------------------------------------------------------------------------
// Theme augmentation: expose editor syntax-token colors as first-class theme
// properties (theme.editor.keyword, etc.) so any component in the app — not
// just the code viewer in this playground — can pull consistent token colors
// instead of hardcoding hex values.
// ---------------------------------------------------------------------------
interface EditorTokens {
  background: string;
  gutter: string;
  gutterText: string;
  selection: string;
  caretLine: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  comment: string;
  variable: string;
  class: string;
  operator: string;
  punctuation: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    editor: EditorTokens;
  }
  interface ThemeOptions {
    editor?: Partial<EditorTokens>;
  }
}

const editorTokens: EditorTokens = {
  background: darcula.bg,
  gutter: darcula.gutter,
  gutterText: darcula.textDisabled,
  selection: darcula.selection,
  caretLine: darcula.caretLine,
  keyword: darcula.orange,
  string: darcula.green,
  number: darcula.blue,
  function: darcula.yellow,
  comment: darcula.gray,
  variable: darcula.text,
  class: darcula.purple,
  operator: darcula.text,
  punctuation: darcula.textDim,
};

// Condensed spacing unit: MUI's default is 8px. 4px reads as "desktop tool"
// density (IntelliJ, VS Code) rather than the touch-friendly default.
const SPACING_UNIT = 4;

const monospaceFontStack = [
  '"JetBrains Mono"',
  '"Fira Code"',
  '"Cascadia Code"',
  '"SF Mono"',
  'Consolas',
  '"Liberation Mono"',
  'Menlo',
  'Monaco',
  'monospace',
].join(', ');

const baseOptions: ThemeOptions = {
  editor: editorTokens,
  spacing: SPACING_UNIT,
  shape: {
    borderRadius: 3, // IDEs favor square-ish chrome over rounded corners
  },
  palette: {
    mode: 'dark',
    background: {
      default: darcula.bg,
      paper: darcula.bgElevated,
    },
    primary: {
      main: darcula.accentBlue,
      light: darcula.accentBlueBright,
      dark: '#365880',
      contrastText: darcula.textBright,
    },
    secondary: {
      main: darcula.orange,
      contrastText: darcula.textBright,
    },
    error: {
      main: darcula.red,
    },
    warning: {
      main: darcula.warnYellow,
      contrastText: '#1E1E1E',
    },
    info: {
      main: darcula.blue,
    },
    success: {
      main: darcula.green,
    },
    text: {
      primary: darcula.text,
      secondary: darcula.textDim,
      disabled: darcula.textDisabled,
    },
    divider: darcula.border,
    action: {
      active: darcula.text,
      hover: alpha(darcula.textBright, 0.06),
      selected: alpha(darcula.accentBlue, 0.28),
      focus: alpha(darcula.accentBlue, 0.4),
      disabled: darcula.textDisabled,
      disabledBackground: alpha(darcula.textBright, 0.04),
    },
  },
  typography: {
    fontFamily: monospaceFontStack,
    fontSize: 13, // condensed from MUI's default 14
    htmlFontSize: 16,
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '0.95rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.85rem' },
    subtitle2: { fontSize: '0.78rem', fontWeight: 600 },
    body1: { fontSize: '0.8125rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.5 },
    button: { fontSize: '0.75rem', textTransform: 'none', fontWeight: 500 },
    caption: { fontSize: '0.6875rem' },
    overline: { fontSize: '0.6875rem', letterSpacing: '0.06em' },
  },
};

/** Reusable dense control sizing shared by several component overrides. */
const denseControlHeight = 26;

export const darculaTheme: Theme = createTheme({
  ...baseOptions,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${darcula.borderLight} ${darcula.bgSunken}`,
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-track': {
          background: darcula.bgSunken,
        },
        '*::-webkit-scrollbar-thumb': {
          background: darcula.borderLight,
          borderRadius: 0,
          border: `2px solid ${darcula.bgSunken}`,
        },
        '*::-webkit-scrollbar-corner': {
          background: darcula.bgSunken,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: darcula.bgElevated,
          backgroundImage: 'none',
          borderBottom: `1px solid ${darcula.border}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '32px !important',
          paddingLeft: 8,
          paddingRight: 8,
        },
        dense: {
          minHeight: '28px !important',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: darcula.bgElevated,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: darcula.bgElevated,
          backgroundImage: 'none',
          borderColor: darcula.border,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: darcula.border },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          minHeight: denseControlHeight,
          padding: '2px 10px',
          borderRadius: 3,
          fontSize: '0.75rem',
        },
        sizeSmall: {
          minHeight: 22,
          padding: '1px 8px',
        },
        outlined: {
          borderColor: darcula.borderLight,
        },
      },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 3,
          padding: 4,
        },
        sizeSmall: {
          padding: 3,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          backgroundColor: darcula.bgSunken,
        },
        input: {
          padding: '4px 8px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          '& fieldset': { borderColor: darcula.border },
          '&:hover fieldset': { borderColor: darcula.borderLight },
          '&.Mui-focused fieldset': { borderColor: darcula.accentBlue, borderWidth: 1 },
        },
        input: {
          padding: '4.5px 8px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.8125rem' },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: darcula.bgElevated,
          border: `1px solid ${darcula.border}`,
          borderRadius: 3,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          minHeight: 26,
          padding: '3px 12px',
          '&.Mui-selected': {
            backgroundColor: alpha(darcula.accentBlue, 0.28),
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        padding: {
          paddingTop: 2,
          paddingBottom: 2,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 24,
          paddingTop: 2,
          paddingBottom: 2,
          borderRadius: 0,
          '&.Mui-selected': {
            backgroundColor: alpha(darcula.accentBlue, 0.28),
            '&:hover': { backgroundColor: alpha(darcula.accentBlue, 0.34) },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 24, color: darcula.textDim },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: { margin: 0 },
        primary: { fontSize: '0.8125rem', lineHeight: 1.4 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 30 },
        indicator: { backgroundColor: darcula.accentBlue, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 30,
          padding: '4px 12px',
          fontSize: '0.75rem',
          textTransform: 'none',
          color: darcula.textDim,
          '&.Mui-selected': { color: darcula.textBright },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 20,
          fontSize: '0.6875rem',
          borderRadius: 3,
        },
        label: { padding: '0 6px' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E1E1E',
          border: `1px solid ${darcula.border}`,
          color: darcula.text,
          fontSize: '0.6875rem',
          borderRadius: 3,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '4px 8px',
          fontSize: '0.75rem',
          borderColor: darcula.border,
        },
        head: {
          fontSize: '0.6875rem',
          color: darcula.textDim,
          backgroundColor: darcula.bgSunken,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiCheckbox: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { padding: 4 } },
    },
    MuiRadio: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { padding: 4 } },
    },
    MuiSwitch: {
      defaultProps: { size: 'small' },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 3 },
        thumb: { width: 12, height: 12 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { fontSize: '0.75rem', padding: '2px 10px', borderRadius: 3 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: '0.625rem', height: 15, minWidth: 15 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 2, borderRadius: 0, backgroundColor: darcula.border },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: darcula.bgElevated,
          backgroundImage: 'none',
          border: `1px solid ${darcula.border}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '0.9rem', padding: '10px 16px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '8px 16px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '8px 16px' },
      },
    },
  },
} as ThemeOptions);

export default darculaTheme;
