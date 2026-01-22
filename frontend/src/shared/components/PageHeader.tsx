import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: PageHeaderProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((item, index) =>
            item.href ? (
              <Link
                key={index}
                component={RouterLink}
                to={item.href}
                color="inherit"
                underline="hover"
              >
                {item.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
};
