import { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography } from '@mui/material';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import type { FileNode } from '../data/mockFiles';
import { fileTree } from '../data/mockFiles';

function iconFor(node: FileNode, open: boolean) {
  if (node.type === 'folder') return open ? FolderOpenRoundedIcon : FolderRoundedIcon;
  if (node.language === 'json') return DataObjectRoundedIcon;
  if (node.language === 'md') return ArticleOutlinedIcon;
  return DescriptionOutlinedIcon;
}

interface TreeProps {
  node: FileNode;
  depth: number;
  activeFile: string;
  onSelectFile: (name: string) => void;
}

function Tree({ node, depth, activeFile, onSelectFile }: TreeProps) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = iconFor(node, open);
  const isActive = node.type === 'file' && node.name === activeFile;

  return (
    <>
      <ListItemButton
        selected={isActive}
        onClick={() => (node.type === 'folder' ? setOpen((o) => !o) : onSelectFile(node.name))}
        sx={{ pl: 1 + depth * 1.5 }}
      >
        <ListItemIcon>
          <Icon
            fontSize="small"
            sx={{ color: node.type === 'folder' ? 'warning.main' : 'text.disabled', fontSize: 16 }}
          />
        </ListItemIcon>
        <ListItemText primary={node.name} />
      </ListItemButton>
      {node.type === 'folder' && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {node.children?.map((child) => (
            <Tree key={child.name} node={child} depth={depth + 1} activeFile={activeFile} onSelectFile={onSelectFile} />
          ))}
        </Collapse>
      )}
    </>
  );
}

interface FileExplorerProps {
  activeFile: string;
  onSelectFile: (name: string) => void;
}

export function FileExplorer({ activeFile, onSelectFile }: FileExplorerProps) {
  return (
    <Box sx={{ width: 220, borderRight: '1px solid', borderColor: 'divider', height: '100%', overflow: 'auto' }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', px: 1.5, pt: 1, pb: 0.5, color: 'text.disabled' }}
      >
        Project
      </Typography>
      <List dense disablePadding>
        <Tree node={fileTree} depth={0} activeFile={activeFile} onSelectFile={onSelectFile} />
      </List>
    </Box>
  );
}
