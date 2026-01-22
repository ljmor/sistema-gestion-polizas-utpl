import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.GESTOR_EMAIL || 'ljmora004@outlook.com';
  const password = process.env.GESTOR_PASSWORD || 'GestorUTPL2025!';
  
  console.log(`Actualizando contraseña para: ${email}`);
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      passwordHash,
      isActive: true 
    },
    create: {
      email,
      name: process.env.GESTOR_NAME || 'Gestor UTPL',
      role: 'GESTOR',
      passwordHash,
      isActive: true,
    },
  });
  
  console.log(`✅ Usuario actualizado: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Contraseña establecida: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
