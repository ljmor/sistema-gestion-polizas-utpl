import { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { CloudUpload, InsertDriveFile, Delete } from '@mui/icons-material';
import { formatFileSize } from '../utils/format';
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '../utils/constants';

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  acceptedFiles?: File[];
  onFileRemove?: (index: number) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
}

export const FileDropzone = ({
  onFilesAccepted,
  acceptedFiles = [],
  onFileRemove,
  accept = ACCEPTED_FILE_TYPES.documents,
  maxFiles = 5,
  maxSize = MAX_FILE_SIZE,
  disabled = false,
  label = 'Arrastra archivos aquí o haz clic para seleccionar',
}: FileDropzoneProps) => {
  const onDrop = useCallback(
    (files: File[]) => {
      onFilesAccepted(files);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - acceptedFiles.length,
    maxSize,
    disabled: disabled || acceptedFiles.length >= maxFiles,
  });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragReject
            ? 'error.main'
            : isDragActive
            ? 'primary.main'
            : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            bgcolor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CloudUpload
            sx={{ fontSize: 48, color: disabled ? 'text.disabled' : 'primary.main' }}
          />
          <Typography
            variant="body1"
            color={disabled ? 'text.disabled' : 'text.secondary'}
            textAlign="center"
          >
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Máximo {maxFiles} archivos, {formatFileSize(maxSize)} cada uno
          </Typography>
        </Box>
      </Paper>

      {acceptedFiles.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {acceptedFiles.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                onFileRemove && (
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => onFileRemove(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
