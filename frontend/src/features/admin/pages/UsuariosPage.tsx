import { useState } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Box,
  Avatar,
  Typography,
} from '@mui/material';
import { Add, Edit, Delete, Block } from '@mui/icons-material';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Role, roleLabels } from '../../../domain/enums/roles';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: Role;
  activo: boolean;
  createdAt: string;
}

export const UsuariosPage = () => {
  // Mock data para desarrollo
  const mockUsuarios: Usuario[] = [
    {
      id: '1',
      nombre: 'Juan',
      apellido: 'Gestor',
      email: 'juan.gestor@utpl.edu.ec',
      role: Role.GESTOR,
      activo: true,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      nombre: 'María',
      apellido: 'Finanzas',
      email: 'maria.finanzas@utpl.edu.ec',
      role: Role.FINANZAS,
      activo: true,
      createdAt: '2024-01-01',
    },
    {
      id: '3',
      nombre: 'Carlos',
      apellido: 'Aseguradora',
      email: 'carlos@aseguradora.com',
      role: Role.ASEGURADORA,
      activo: false,
      createdAt: '2024-01-01',
    },
  ];

  const roleColors: Record<Role, 'primary' | 'secondary' | 'info' | 'default' | 'success'> = {
    [Role.GESTOR]: 'primary',
    [Role.FINANZAS]: 'secondary',
    [Role.ASEGURADORA]: 'info',
    [Role.REPORTANTE]: 'default',
    [Role.BENEFICIARIO]: 'success',
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de usuarios del sistema"
        actions={
          <Button variant="contained" startIcon={<Add />}>
            Nuevo usuario
          </Button>
        }
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {usuario.nombre.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>
                          {usuario.nombre} {usuario.apellido}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[usuario.role]}
                      size="small"
                      color={roleColors[usuario.role]}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={usuario.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={usuario.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" title="Editar">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" title={usuario.activo ? 'Desactivar' : 'Activar'}>
                      <Block />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  );
};
