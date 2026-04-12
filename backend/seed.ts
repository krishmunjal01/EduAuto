import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'krishmunjal126@gmail.com';
  const password = await bcrypt.hash('admin123@', 10);

  // Check if admin already exists
  let admin = await prisma.user.findUnique({
    where: { email }
  });

  if (!admin) {
    // Create Default School
    const school = await prisma.school.create({
      data: {
        school_name: 'EduAuto Central Academy',
        school_code: 'EACA',
        board: 'CBSE',
        city: 'New Delhi',
        state: 'Delhi',
        contact_number: '+91 9999999999',
        email: 'contact@eaca.edu.in'
      }
    });

    console.log('School created:', school.school_name);

    admin = await prisma.user.create({
      data: {
        school_id: school.id,
        name: 'Krish Munjal',
        email,
        password,
        role: 'admin',
        status: 'active'
      }
    });
    console.log('Admin account created:', admin.email);
  } else {
    // Update password if it already exists
    await prisma.user.update({
      where: { email },
      data: { password }
    });
    console.log('Admin account already exists. Password updated.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
