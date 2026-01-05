import { TextField, Grid, MenuItem } from '@mui/material';
import { Control, Controller, UseFormRegister, FieldErrors } from 'react-hook-form';
import { TipoSiniestro } from '../../../domain/enums/estados';
import { RELACIONES_REPORTANTE } from '../../../shared/utils/constants';

interface ReporteFormData {
  fallecido: {
    nombreCompleto: string;
    cedula: string;
    fechaDefuncion: string;
  };
  tipoPreliminar: TipoSiniestro;
  observaciones?: string;
  reportante: {
    nombre: string;
    relacion: 'FAMILIAR' | 'COMPANERO' | 'PERSONAL' | 'OTRO';
    email: string;
    telefono: string;
  };
}

interface ReporteFormProps {
  register: UseFormRegister<ReporteFormData>;
  control: Control<ReporteFormData>;
  errors: FieldErrors<ReporteFormData>;
}

export const ReporteFormFields = ({ register, control, errors }: ReporteFormProps) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('fallecido.nombreCompleto')}
          fullWidth
          label="Nombre completo del fallecido"
          error={!!errors.fallecido?.nombreCompleto}
          helperText={errors.fallecido?.nombreCompleto?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('fallecido.cedula')}
          fullWidth
          label="Cédula del fallecido"
          error={!!errors.fallecido?.cedula}
          helperText={errors.fallecido?.cedula?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('fallecido.fechaDefuncion')}
          fullWidth
          label="Fecha de defunción"
          type="date"
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: today }}
          error={!!errors.fallecido?.fechaDefuncion}
          helperText={errors.fallecido?.fechaDefuncion?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="tipoPreliminar"
          control={control}
          render={({ field }) => (
            <TextField {...field} select fullWidth label="Tipo preliminar">
              <MenuItem value={TipoSiniestro.NATURAL}>Natural</MenuItem>
              <MenuItem value={TipoSiniestro.ACCIDENTE}>Accidente</MenuItem>
              <MenuItem value={TipoSiniestro.DESCONOCIDO}>Desconocido</MenuItem>
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField
          {...register('observaciones')}
          fullWidth
          label="Observaciones"
          multiline
          rows={3}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('reportante.nombre')}
          fullWidth
          label="Nombre del reportante"
          error={!!errors.reportante?.nombre}
          helperText={errors.reportante?.nombre?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="reportante.relacion"
          control={control}
          render={({ field }) => (
            <TextField {...field} select fullWidth label="Relación con el fallecido">
              {RELACIONES_REPORTANTE.map((rel) => (
                <MenuItem key={rel.value} value={rel.value}>
                  {rel.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('reportante.email')}
          fullWidth
          label="Correo electrónico"
          type="email"
          error={!!errors.reportante?.email}
          helperText={errors.reportante?.email?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('reportante.telefono')}
          fullWidth
          label="Teléfono"
          error={!!errors.reportante?.telefono}
          helperText={errors.reportante?.telefono?.message}
        />
      </Grid>
    </Grid>
  );
};
