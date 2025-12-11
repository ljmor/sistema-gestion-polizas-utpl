import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, IconButton, Slide, Stack } from '@mui/material';
import { Close, Warning, Error as ErrorIcon, Info, NotificationsActive } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  caseCode?: string;
  onClick?: () => void;
}

interface MacOSNotificationProps {
  notification: AppNotification;
  onClose: (id: string) => void;
  index: number;
}

const severityConfig = {
  info: {
    icon: <Info />,
    color: '#2196F3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
  },
  warning: {
    icon: <Warning />,
    color: '#FF9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
  },
  error: {
    icon: <ErrorIcon />,
    color: '#F44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
  },
  success: {
    icon: <NotificationsActive />,
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
  },
};

const MacOSNotification = ({ notification, onClose, index }: MacOSNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = severityConfig[notification.severity];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, 8000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        component={motion.div}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={notification.onClick}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 2,
          mb: 1,
          width: 360,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: 'divider',
          cursor: notification.onClick ? 'pointer' : 'default',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: config.color,
            borderRadius: '4px 0 0 4px',
          },
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.1)',
          },
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: config.bgColor,
            color: config.color,
            flexShrink: 0,
          }}
        >
          {config.icon}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {notification.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
              {formatTimeAgo(notification.timestamp)}
            </Typography>
          </Box>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {notification.message}
          </Typography>

          {notification.caseCode && (
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                mt: 1,
                px: 1,
                py: 0.25,
                bgcolor: 'action.hover',
                borderRadius: 1,
                fontFamily: 'monospace',
              }}
            >
              #{notification.caseCode}
            </Typography>
          )}
        </Box>

        {/* Close button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0.6,
            '&:hover': { opacity: 1 },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHour < 24) return `hace ${diffHour}h`;
  return new Date(date).toLocaleDateString('es-EC');
}

// Container for multiple notifications
interface NotificationContainerProps {
  notifications: AppNotification[];
  onClose: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onClose }: NotificationContainerProps) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 9999,
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
        },
      }}
    >
      <AnimatePresence>
        <Stack spacing={1}>
          {notifications.slice(0, 5).map((notification, index) => (
            <MacOSNotification
              key={notification.id}
              notification={notification}
              onClose={onClose}
              index={index}
            />
          ))}
        </Stack>
      </AnimatePresence>
    </Box>
  );
};

export default MacOSNotification;
