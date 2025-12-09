import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Avatar,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const ConfirmationModal = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure?',
  subMessage = '',
  onConfirm,
  onCancel,
  loading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'error',
  icon = 'warning',
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'delete':
        return <DeleteIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const getAvatarColor = () => {
    if (icon === 'delete') return 'error.main';
    return 'warning.main';
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="confirmation-dialog-title" sx={{ pb: 2 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar sx={{ bgcolor: getAvatarColor(), mt: 0.5, flexShrink: 0 }}>
            {getIcon()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              id="confirmation-dialog-description"
              sx={{ fontWeight: 500, mb: subMessage ? 1 : 0 }}
            >
              {message}
            </Typography>
            {subMessage && (
              <Typography variant="body2" color="text.secondary">
                {subMessage}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
