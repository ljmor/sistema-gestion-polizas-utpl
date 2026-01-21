import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Paper,
  Popper,
  ClickAwayListener,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Description,
  Policy,
  Notifications,
  Assessment,
  Person,
  Logout,
  Search,
  Folder,
  Settings,
} from '@mui/icons-material';
import { useAuthStore } from '../../application/services/authStore';
import { useAlertsStore } from '../../application/services/alertsService';
import { useNotificationStore, setGlobalNavigate } from '../../application/services/notificationService';
import { NotificationContainer } from '../../shared/components/MacOSNotification';
import { APP_NAME } from '../../shared/utils/constants';
import { httpClient } from '../../infrastructure/api/httpClient';

interface SearchResult {
  type: 'siniestro' | 'poliza';
  id: string;
  title: string;
  subtitle: string;
  status?: string;
}

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/app/dashboard' },
  { text: 'Siniestros', icon: <Description />, path: '/app/siniestros' },
  { text: 'Pólizas', icon: <Policy />, path: '/app/polizas' },
  { text: 'Alertas', icon: <Notifications />, path: '/app/alertas' },
  { text: 'Reportes', icon: <Assessment />, path: '/app/reportes' },
  { text: 'Configuración', icon: <Settings />, path: '/app/configuracion' },
];

export const AppShell = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);

  const { user, logout } = useAuthStore();
  const unreadCount = useAlertsStore((state) => state.unreadCount);
  const { notifications, removeNotification, startPolling, stopPolling } = useNotificationStore();

  // Inicializar navegación global para notificaciones
  useEffect(() => {
    setGlobalNavigate(navigate);
  }, [navigate]);

  // Iniciar polling de alertas cuando se monta el componente
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Search debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await httpClient.get<SearchResult[]>(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchAnchorEl(null);
    if (result.type === 'siniestro') {
      navigate(`/app/siniestros/${result.id}`);
    } else {
      navigate(`/app/polizas/${result.id}`);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap component="div" fontWeight={700} color="primary">
          {APP_NAME}
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.text === 'Alertas' ? (
                  <Badge badgeContent={unreadCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Notificaciones estilo macOS */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ position: 'relative', flexGrow: 1, maxWidth: 400 }}>
            <TextField
              size="small"
              placeholder="Buscar #Caso, Cédula, Nombre..."
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchAnchorEl(e.currentTarget);
              }}
              onFocus={(e) => setSearchAnchorEl(e.currentTarget)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              }}
            />
            <Popper
              open={Boolean(searchAnchorEl) && (searchResults.length > 0 || searchQuery.length >= 2)}
              anchorEl={searchAnchorEl}
              placement="bottom-start"
              style={{ zIndex: 1300, width: searchAnchorEl?.offsetWidth }}
            >
              <ClickAwayListener onClickAway={() => setSearchAnchorEl(null)}>
                <Paper sx={{ mt: 0.5, maxHeight: 300, overflow: 'auto' }}>
                  {searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      No se encontraron resultados
                    </Box>
                  ) : (
                    <List dense>
                      {searchResults.map((result) => (
                        <ListItem
                          key={`${result.type}-${result.id}`}
                          disablePadding
                          onClick={() => handleSearchResultClick(result)}
                        >
                          <ListItemButton>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {result.type === 'siniestro' ? (
                                <Description fontSize="small" color="primary" />
                              ) : (
                                <Folder fontSize="small" color="secondary" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={result.title}
                              secondary={result.subtitle}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            {result.status && (
                              <Chip
                                label={result.status}
                                size="small"
                                sx={{ ml: 1, fontSize: '0.65rem' }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </ClickAwayListener>
            </Popper>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            color="inherit"
            onClick={() => navigate('/app/alertas')}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/app/perfil'); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Mi perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
