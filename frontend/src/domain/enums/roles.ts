export enum Role {
  GESTOR = 'GESTOR',
  FINANZAS = 'FINANZAS',
  ASEGURADORA = 'ASEGURADORA',
  REPORTANTE = 'REPORTANTE',
  BENEFICIARIO = 'BENEFICIARIO',
}

export const roleLabels: Record<Role, string> = {
  [Role.GESTOR]: 'Gestor',
  [Role.FINANZAS]: 'Finanzas',
  [Role.ASEGURADORA]: 'Aseguradora',
  [Role.REPORTANTE]: 'Reportante',
  [Role.BENEFICIARIO]: 'Beneficiario',
};

export const rolePermissions: Record<Role, string[]> = {
  [Role.GESTOR]: [
    'siniestros.view',
    'siniestros.create',
    'siniestros.edit',
    'siniestros.delete',
    'polizas.view',
    'polizas.edit',
    'beneficiarios.manage',
    'documentos.manage',
    'liquidacion.manage',
    'alertas.view',
    'reportes.view',
  ],
  [Role.FINANZAS]: [
    'siniestros.view',
    'pagos.register',
    'documentos.upload',
    'alertas.view',
    'reportes.view',
  ],
  [Role.ASEGURADORA]: [
    'siniestros.view',
    'liquidacion.upload',
    'alertas.view',
  ],
  [Role.REPORTANTE]: [
    'reporte.create',
  ],
  [Role.BENEFICIARIO]: [
    'siniestros.view.own',
  ],
};
