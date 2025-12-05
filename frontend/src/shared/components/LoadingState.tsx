import { Box, CircularProgress, Typography, Skeleton, Card, CardContent, Grid } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState = ({
  message = 'Cargando...',
  fullScreen = false,
}: LoadingStateProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: fullScreen ? 0 : 8,
        height: fullScreen ? '100vh' : 'auto',
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export const CardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <Box>
    <Skeleton variant="rectangular" height={56} sx={{ mb: 1 }} />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 0.5 }} />
    ))}
  </Box>
);

export const DashboardSkeleton = () => (
  <Grid container spacing={3}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
        <CardSkeleton />
      </Grid>
    ))}
    <Grid size={{ xs: 12, md: 8 }}>
      <Card>
        <CardContent>
          <Skeleton variant="text" width="30%" height={32} />
          <TableSkeleton rows={5} />
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <Card>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);
