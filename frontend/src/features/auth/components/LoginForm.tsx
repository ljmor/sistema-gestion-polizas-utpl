import { TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Login } from '@mui/icons-material';
import { useState } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  register: UseFormRegister<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  loading: boolean;
  onSubmit: () => void;
}

export const LoginForm = ({ register, errors, loading, onSubmit }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <TextField
        {...register('email')}
        fullWidth
        label="Correo electrónico"
        type="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        sx={{ mb: 2 }}
        autoComplete="email"
      />

      <TextField
        {...register('password')}
        fullWidth
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        error={!!errors.password}
        helperText={errors.password?.message}
        sx={{ mb: 3 }}
        autoComplete="current-password"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={<Login />}
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
};
