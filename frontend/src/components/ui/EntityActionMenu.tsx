import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTour } from '../../contexts/TourContext';

export type ActionItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isDestructive?: boolean;
};

export interface EntityActionMenuProps {
  actions: ActionItem[];
  menuClassName?: string;
}

const EntityActionMenu: React.FC<EntityActionMenuProps> = ({ actions, menuClassName }) => {
  const [open, setOpen] = useState(false);
  const { activeTour, stepIndex, setStepIndex, setRun } = useTour();
  const [clickedAction, setClickedAction] = useState(false);

  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (open) wasOpenRef.current = true;
  }, [open]);

  React.useEffect(() => {
    if (activeTour === 'user_save_books') {
      if (open && stepIndex === 0) {
        setStepIndex(1);
      }
      if (!open && wasOpenRef.current && stepIndex === 1 && !clickedAction) {
        setRun(false);
        wasOpenRef.current = false;
      }
    } else if (activeTour === 'lib_rag_index') {
      if (open && stepIndex === 1) {
        setStepIndex(2);
      }
      if (!open && wasOpenRef.current && stepIndex === 2 && !clickedAction) {
        setRun(false);
        wasOpenRef.current = false;
      }
    } else if (activeTour === 'admin_users') {
      const isMobileTour = window.innerWidth < 1200;
      const targetStep = isMobileTour ? 2 : 1;
      
      if (open && stepIndex === targetStep) {
        setStepIndex(targetStep + 1);
      }
      if (!open && wasOpenRef.current && stepIndex === targetStep + 1 && !clickedAction) {
        setRun(false);
        wasOpenRef.current = false;
      }
    }
  }, [open, activeTour, stepIndex, setStepIndex, setRun, clickedAction]);
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setClickedAction(false);
    setOpen(true);
  };

  const handleClose = (e?: React.MouseEvent | {}, reason?: string) => {
    if (e && 'stopPropagation' in e) {
      (e as React.MouseEvent).stopPropagation();
      (e as React.MouseEvent).preventDefault();
    }
    setOpen(false);
  };

  const handleActionClick = (e: React.MouseEvent, actionOnClick: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    setClickedAction(true);
    actionOnClick();
    handleClose();
  };

  if (!actions || actions.length === 0) return null;

  return (
    <>
      <IconButton className={menuClassName || "tour-book-card-menu"} onClick={handleOpen} size="small" aria-label="More actions">
        <MoreVertIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        PaperProps={{
          sx: {
            minWidth: { xs: '90vw', sm: 300 },
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ py: 0 }}>
          <List>
            {actions.map((action, index) => {
              let className = undefined;
              if (action.label === 'Додати до списку') className = 'tour-add-to-list-option';
              if (action.label === 'Згенерувати RAG-індекс (AI)') className = 'tour-index-option';
              if (action.label === 'Редагувати') className = 'tour-user-action-edit';
              
              return (
                <ListItem disablePadding key={index} className={className}>
                  <ListItemButton
                  onClick={(e) => handleActionClick(e, action.onClick)}
                  sx={{
                    px: 3,
                    py: 1.5,
                    color: action.isDestructive ? 'error.main' : 'inherit',
                    '& .MuiListItemIcon-root': {
                      color: action.isDestructive ? 'error.main' : 'inherit',
                      minWidth: 40,
                    },
                  }}
                >
                  <ListItemIcon>{action.icon}</ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body1">{action.label}</Typography>}
                  />
                </ListItemButton>
              </ListItem>
              );
            })}
          </List>
        </Box>
      </Dialog>
    </>
  );
};

export default EntityActionMenu;
