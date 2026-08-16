import { Box, useTheme } from '@mui/material';
import type { CodeLine, TokenKind } from '../data/mockFiles';

interface CodeViewProps {
  lines: CodeLine[];
}

/**
 * Renders mock source with syntax-token colors pulled from theme.editor —
 * the whole point of exposing those tokens on the theme is that any
 * component (this one, a real editor integration, a diff viewer) can share
 * one palette instead of hardcoding hex values per-component.
 */
export function CodeView({ lines }: CodeViewProps) {
  const theme = useTheme();

  const colorFor = (kind: TokenKind): string => {
    switch (kind) {
      case 'keyword':
        return theme.editor.keyword;
      case 'string':
        return theme.editor.string;
      case 'number':
        return theme.editor.number;
      case 'function':
        return theme.editor.function;
      case 'comment':
        return theme.editor.comment;
      case 'class':
        return theme.editor.class;
      case 'operator':
      case 'punctuation':
        return theme.editor.punctuation;
      case 'variable':
      case 'plain':
      default:
        return theme.editor.variable;
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.editor.background,
        fontFamily: theme.typography.fontFamily,
        fontSize: '0.8125rem',
        lineHeight: '20px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {lines.map((line, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            '&:hover': { backgroundColor: theme.editor.caretLine },
          }}
        >
          <Box
            component="span"
            sx={{
              width: 40,
              flexShrink: 0,
              textAlign: 'right',
              paddingRight: '12px',
              color: theme.editor.gutterText,
              backgroundColor: theme.editor.gutter,
              userSelect: 'none',
            }}
          >
            {i + 1}
          </Box>
          <Box component="span" sx={{ pl: '12px', whiteSpace: 'pre' }}>
            {line.length === 0 ? ' ' : null}
            {line.map((token, j) => (
              <Box key={j} component="span" sx={{ color: colorFor(token.kind) }}>
                {token.text}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
