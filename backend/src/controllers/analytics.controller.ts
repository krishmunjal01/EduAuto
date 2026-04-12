import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenAI, Type } from '@google/genai';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Production Analytics — Real marks from the Result table
 */
export const getAnalyticsData = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.school_id;
    const sectionId = req.query.sectionId as string | undefined;

    // Build filter
    const where: any = { test: { section: { school_id: schoolId } } };
    if (sectionId) {
      where.test = { ...where.test, section_id: sectionId };
    }

    // Get all results with student and test info
    const results = await prisma.result.findMany({
      where,
      include: {
        student: true,
        test: { include: { section: true } }
      },
      orderBy: { test: { date: 'desc' } }
    });

    // Build student marks map (latest marks per student)
    const studentMarksMap: Record<string, { name: string; marks: number; subject: string; sectionName: string }> = {};
    for (const r of results) {
      if (!studentMarksMap[r.student_id]) {
        studentMarksMap[r.student_id] = {
          name: r.student.name,
          marks: r.marks,
          subject: r.test.section?.subject || 'General',
          sectionName: r.test.section?.section_name || ''
        };
      }
    }

    const studentsWithMarks = Object.values(studentMarksMap);

    // Performance Data — monthly averages from actual tests
    const monthlyMap: Record<string, number[]> = {};
    for (const r of results) {
      const month = r.test.date.toLocaleString('en', { month: 'short' });
      if (!monthlyMap[month]) monthlyMap[month] = [];
      monthlyMap[month].push(r.marks);
    }

    const performanceData = Object.entries(monthlyMap).map(([month, marks]) => ({
      month,
      classAvg: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
      topPerformer: Math.max(...marks),
      lowest: Math.min(...marks)
    }));

    // Marks Distribution — real histogram
    const ranges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];
    const marksDistribution = ranges.map(r => ({
      range: r.range,
      count: studentsWithMarks.filter(s => s.marks >= r.min && s.marks <= r.max).length
    }));

    res.json({
      students: studentsWithMarks,
      performanceData,
      marksDistribution,
      totalResults: results.length
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Production AI Feedback — Gemini Micro-Batching Engine
 * Generates personalized insights from real marks using AI modeling
 */
export const generateAIFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.school_id;

    const students = await prisma.student.findMany({
      where: { school_id: schoolId },
      include: {
        results: { include: { test: true }, orderBy: { test: { date: 'asc' } } },
        attendances: true,
        section: true
      },
      take: 20
    });

    const validStudents = students.filter(s => s.results.length > 0);
    if (validStudents.length === 0) {
      return res.json({ feedbacks: [] });
    }

    // 1. Build contextual metrics for the AI to analyze
    const analysisPayload = validStudents.map(student => {
      const marks = student.results.map(r => r.marks);
      const latestMark = marks[marks.length - 1];
      const avgMark = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);

      let trend = 'stable';
      if (marks.length >= 2) {
        const firstHalf = marks.slice(0, Math.ceil(marks.length / 2));
        const secondHalf = marks.slice(Math.ceil(marks.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avgSecond > avgFirst + 5) trend = 'improving';
        else if (avgSecond < avgFirst - 5) trend = 'declining';
      }

      const totalAtt = student.attendances.length;
      const presentCount = student.attendances.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

      const allStudentMarks = students
        .filter(s => s.section_id === student.section_id && s.results.length > 0)
        .map(s => s.results[s.results.length - 1]?.marks || 0)
        .sort((a, b) => b - a);
      const rank = allStudentMarks.indexOf(latestMark) + 1;
      const totalInSection = allStudentMarks.length;

      return {
        id: student.id,
        name: student.name,
        latestMarks: latestMark,
        avgMarks: avgMark,
        trend,
        attendanceRate,
        rank,
        totalInSection,
        section: student.section?.section_name || ''
      };
    });

    // 2. Micro-batch the students via Gemini
    const schema = {
      type: Type.ARRAY,
      description: "An array of tailored feedback for each student strictly corresponding to the submitted array of student profiles.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The UUID of the student from the payload" },
          feedback: { type: Type.STRING, description: "Professional, encouraging, 2-sentence advice for the parent based on the student's metrics." }
        },
        required: ["id", "feedback"]
      }
    };

    const promptText = `
      You are an elite academic counselor. I am providing a JSON array of student performance profiles. 
      Generate a professional, encouraging, 2-sentence feedback insight for each student based on their statistics (marks, trend, attendance, rank).
      Keep the tone highly professional yet warm. Do NOT use markdown.
      
      Students:
      ${JSON.stringify(analysisPayload)}
    `;

    const gRes = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7
      }
    });

    const generatedArray = JSON.parse(gRes.text || "[]");
    const feedbackMap = new Map(generatedArray.map((i: any) => [i.id, i.feedback]));

    // 3. Assemble and return identically structured list
    const feedbacks = analysisPayload.map(payload => ({
      ...payload,
      student: payload.name, 
      totalTests: validStudents.find(s => s.id === payload.id)?.results.length || 0,
      feedback: feedbackMap.get(payload.id) || "Continuing to show consistent effort in class."
    }));

    res.json({ feedbacks });
  } catch (err) {
    console.error('AI Feedback error:', err);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
};
