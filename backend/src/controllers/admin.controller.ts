import { Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const sections = await prisma.section.findMany({
      where: { school_id: req.user!.school_id },
      include: { 
        students: true, 
        teacherSections: { include: { teacher: true } },
        timetables: { include: { teacher: true } }
      }
    });
    
    // Enrich sections with all teachers (from TeacherSection + timetable assignments)
    const enriched = sections.map(s => {
      // Get unique teacher emails from both sources
      const tsEmails = s.teacherSections.map(ts => ts.teacher.email);
      const ttEmails = s.timetables.filter(t => t.teacher).map(t => t.teacher!.email);
      const allEmails = [...new Set([...tsEmails, ...ttEmails].filter(Boolean).map(e => e.toLowerCase()))];
      
      // Get all unique teachers
      const teacherMap = new Map<string, any>();
      s.teacherSections.forEach(ts => teacherMap.set(ts.teacher.email.toLowerCase(), ts.teacher));
      s.timetables.forEach(t => { if (t.teacher) teacherMap.set(t.teacher.email.toLowerCase(), t.teacher); });
      
      return {
        ...s,
        allTeacherEmails: allEmails,
        allTeachers: [...teacherMap.values()]
      };
    });
    
    res.json({ sections: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionName, subject, teacherEmail } = req.body;
    
    // Validate teacher exists
    let teacherId = null;
    if (teacherEmail) {
      const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
      if (teacher && teacher.school_id === req.user!.school_id) {
        teacherId = teacher.id;
      }
    }

    const section = await prisma.section.create({
      data: {
        school_id: req.user!.school_id,
        section_name: sectionName,
        subject
      }
    });

    if (teacherId) {
      await prisma.teacherSection.create({
        data: {
          teacher_id: teacherId,
          section_id: section.id
        }
      });
    }

    res.status(201).json({ section });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { school_id: req.user!.school_id, role: 'teacher' },
      include: {
        teacherSections: {
          include: { section: true }
        }
      }
    });
    const result = teachers.map(t => {
      let subject = '';
      let sectionName = '';
      
      // Unpack metadata from student_id if it's JSON
      if (t.student_id && t.student_id.startsWith('{')) {
        try {
          const meta = JSON.parse(t.student_id);
          subject = meta.subject || '';
          sectionName = meta.sectionName || '';
        } catch(e) {}
      }

      // Fallback for legacy
      if (!subject) subject = t.teacherSections?.[0]?.section?.subject || '';
      if (!sectionName) sectionName = t.teacherSections?.[0]?.section?.section_name || '';

      return {
        ...t,
        subject,
        sectionName
      };
    });
    res.json({ teachers: result });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email: rawEmail, password, subject, sectionName } = req.body;
    const email = rawEmail.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const metadata = JSON.stringify({ subject, sectionName });
    const teacher = await prisma.user.create({
      data: {
        school_id: req.user!.school_id,
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
        student_id: metadata
      }
    });

    // Link Teacher to Section mapping if it exists
    if (sectionName) {
      // Normalize name for lookup
      const normalizedName = sectionName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const section = await prisma.section.findFirst({
        where: { 
          school_id: req.user!.school_id,
          section_name: {
            contains: sectionName
          }
        }
      });
      
      if (section) {
        // Also update section's subject if it's "Free" or empty
        if (subject && (!section.subject || section.subject === 'Free')) {
           await prisma.section.update({ where: { id: section.id }, data: { subject } });
        }

        await prisma.teacherSection.create({
          data: {
            teacher_id: teacher.id,
            section_id: section.id
          }
        });
      }
    }

    res.status(201).json({ teacher });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.params.id;
    const { name, status } = req.body;

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, school_id: req.user!.school_id, role: 'teacher' }
    });

    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const updated = await prisma.user.update({
      where: { id: teacherId },
      data: { name, status }
    });

    res.json({ teacher: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating teacher' });
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.params.id;

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, school_id: req.user!.school_id, role: 'teacher' }
    });

    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Remove from teacher sections
    await prisma.teacherSection.deleteMany({ where: { teacher_id: teacherId } });
    
    // Unassign from timetables
    await prisma.timetable.updateMany({
      where: { teacher_id: teacherId },
      data: { teacher_id: null }
    });

    await prisma.user.delete({ where: { id: teacherId } });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting teacher' });
  }
};

export const uploadStudentsCsv = async (req: AuthRequest, res: Response) => {
  try {
    const sectionId = req.params.id;
    
    const section = await prisma.section.findFirst({
      where: { id: sectionId, school_id: req.user!.school_id }
    });
    if (!section) return res.status(404).json({ error: 'Section not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();

    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    if (!allowedExtensions.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type. Please upload a CSV or Excel file.' });
    }

    let records: Record<string, string>[] = [];

    if (ext === '.csv') {
      // Parse CSV
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
    } else {
      // Parse Excel (.xlsx / .xls)
      // Use buffer mode so SheetJS detects format from magic bytes
      // (Multer saves temp files without an extension, so readFile can't auto-detect)
      const fileBuffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });
      // Normalize keys — Excel headers often have leading/trailing spaces
      records = records.map(row => {
        const normalized: Record<string, string> = {};
        for (const key of Object.keys(row)) {
          normalized[key.trim()] = String(row[key]);
        }
        return normalized;
      });
    }

    const school = await prisma.school.findUnique({ where: { id: req.user!.school_id } });
    if (!school) throw new Error("School not found");

    let importedCount = 0;

    for (const record of records) {
      const name = String(record['Name'] || record['name'] || '').trim();
      const rollNo = String(record['Roll No'] || record['Roll Number'] || record['roll_no'] || '').trim();
      const parentName = String(record['Parent Name'] || record['parent_name'] || '').trim() || null;
      const parentPhone = String(record['Parent Phone'] || record['Phone Number'] || record['phone'] || '').trim() || null;

      if (!name || !rollNo) continue;
      
      const count = await prisma.student.count({ where: { school_id: school.id } });
      const seqStr = String(count + 1).padStart(4, '0');
      const studentId = `${school.school_code}_${seqStr}`;

      await prisma.student.create({
        data: {
          school_id: school.id,
          section_id: section.id,
          student_id: studentId,
          name: name,
          roll_number: rollNo,
          parent_name: parentName,
          parent_phone: parentPhone
        }
      });
      importedCount++;
    }

    // Attempt to delete the temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch(e) {}

    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'upload_csv',
        entity: 'Section',
        entity_id: section.id
      }
    });

    res.json({ message: `Successfully imported ${importedCount} students.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error parsing file' });
  }
};

export const deleteSection = async (req: AuthRequest, res: Response) => {
  try {
    const sectionId = req.params.id;
    const section = await prisma.section.findFirst({
      where: { id: sectionId, school_id: req.user!.school_id }
    });
    
    if (!section) return res.status(404).json({ error: 'Section not found' });

    // Manually cascade delete dependencies
    await prisma.student.deleteMany({ where: { section_id: sectionId } });
    await prisma.teacherSection.deleteMany({ where: { section_id: sectionId } });
    await prisma.timetable.deleteMany({ where: { section_id: sectionId } });
    await prisma.test.deleteMany({ where: { section_id: sectionId } });
    await prisma.attendance.deleteMany({ where: { section_id: sectionId } });

    await prisma.section.delete({
      where: { id: sectionId }
    });

    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting section' });
  }
};
