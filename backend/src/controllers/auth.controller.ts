import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'eduauto_super_secret_jwt_key_in_production_change_this';

export const signup = async (req: Request, res: Response) => {
  try {
    const { 
      schoolName, schoolCode, board, affiliationId, address, city, state, contactNumber, schoolEmail,
      adminName, adminEmail: rawAdminEmail, adminPassword 
    } = req.body;
    const adminEmail = rawAdminEmail.toLowerCase();

    const existingSchool = await prisma.school.findUnique({ where: { school_code: schoolCode } });
    if (existingSchool) return res.status(400).json({ error: 'School Code already exists' });

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) return res.status(400).json({ error: 'Admin Email already exists' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const school = await prisma.school.create({
      data: {
        school_name: schoolName,
        school_code: schoolCode,
        board,
        affiliation_id: affiliationId,
        address,
        city,
        state,
        contact_number: contactNumber,
        email: schoolEmail,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
          }
        }
      },
      include: { users: true }
    });

    const admin = school.users[0];
    const token = jwt.sign({ id: admin.id, role: admin.role, school_id: school.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, schoolCode: school.school_code } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

export const parentSignup = async (req: Request, res: Response) => {
  try {
    const { name, email: rawEmail, password, studentId } = req.body;
    const email = rawEmail.toLowerCase();

    // 1. Find student by school-generated ID (string)
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
      include: { school: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student ID not found. Please contact the school office.' });
    }

    // 2. Check if parent already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'parent',
        school_id: student.school_id,
        student_id: student.student_id,
        status: 'active'
      }
    });

    // 4. Link Parent to Student
    await prisma.parentStudent.create({
      data: {
        parent_id: parent.id,
        student_id: student.id
      }
    });

    const token = jwt.sign({ id: parent.id, role: parent.role, school_id: parent.school_id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: parent.id, 
        name: parent.name, 
        email: parent.email, 
        role: parent.role, 
        schoolCode: student.school.school_code,
        studentId: student.student_id 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during parent signup' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, password, role } = req.body;
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email }, include: { school: true, parentStudents: { include: { student: true } } } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(401).json({ error: 'Account inactive' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Validate that the user's actual role matches the selected login role
    if (role && user.role !== role) {
      if (role === 'parent') {
        return res.status(403).json({ error: 'No parent profile found with this email. Please use the correct login type.' });
      } else if (role === 'teacher') {
        return res.status(403).json({ error: 'No teacher profile found with this email. Please use the correct login type.' });
      } else if (role === 'admin') {
        return res.status(403).json({ error: 'No admin profile found with this email. Please use the correct login type.' });
      }
      return res.status(403).json({ error: 'Role mismatch. Please select the correct login type.' });
    }

    const finalStudentId = user.student_id || user.parentStudents?.[0]?.student?.student_id;
    const token = jwt.sign({ id: user.id, role: user.role, school_id: user.school_id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { 
      id: user.id, name: user.name, email: user.email, role: user.role, schoolCode: user.school.school_code, studentId: finalStudentId 
    } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { school: true, parentStudents: { include: { student: true } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const finalStudentId = user.student_id || user.parentStudents?.[0]?.student?.student_id;
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolCode: user.school.school_code,
        studentId: finalStudentId
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

export const resetAdmin = async (req: Request, res: Response) => {
  try {
    const email = 'krishmunjal126@gmail.com';
    const password = await bcrypt.hash('admin123@', 10);
    
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: { school_name: 'EduAuto Academy', school_code: 'EDU001' }
      });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { password, role: 'admin', status: 'active' },
      create: {
        email, name: 'Krish Admin', password, role: 'admin', school_id: school.id, status: 'active'
      }
    });

    res.json({ success: true, message: 'Admin reset successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
};

export const cleanupPhantomSections = async (req: Request, res: Response) => {
  try {
    const sections = await prisma.section.findMany({
      include: { students: true }
    });
    
    let deleted = 0;
    const deletedNames: string[] = [];
    for (const s of sections) {
      // A phantom section: has no students AND name has no digits (not a real class like "10A")
      const isPhantom = s.students.length === 0 && !/\d/.test(s.section_name);
      
      if (isPhantom) {
        await prisma.teacherSection.deleteMany({ where: { section_id: s.id } });
        await prisma.timetable.deleteMany({ where: { section_id: s.id } });
        await prisma.substitution.deleteMany({ where: { section_id: s.id } });
        await prisma.section.delete({ where: { id: s.id } });
        deletedNames.push(s.section_name);
        deleted++;
      }
    }
    
    res.json({ success: true, message: `Cleaned up ${deleted} phantom sections`, deleted: deletedNames, allSections: sections.map(s => ({ name: s.section_name, subject: s.subject, students: s.students.length })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cleanup failed' });
  }
};
