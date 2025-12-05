import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { APP_NAME } from '../../shared/utils/constants';

export const PublicShell = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" fontWeight={700}>
            {APP_NAME}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" align="center">
            Universidad Técnica Particular de Loja - Sistema de Gestión de Pólizas y Siniestros
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
