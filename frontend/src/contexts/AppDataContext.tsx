import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  parentName: string;
  phone: string;
  marks: number;
  subject: string;
  sectionId?: string;
  status: 'matched' | 'unmatched';
}

export interface SchoolInfo {
  schoolName: string;
  schoolCode: string;
  board: string;
  affiliationId: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  schoolEmail: string;
  setupComplete: boolean;
  attendanceMode: 'daily' | 'period';
}

export interface AttendanceRecord {
  id: string;
  sectionId: string;
  date: string;
  studentsPresent: string[]; // array of student global IDs
  studentsAbsent: string[];
}

export interface AttendanceCorrection {
  id: string;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  date: string;
  requestedStatus: 'present' | 'absent';
  currentStatus: 'present' | 'absent';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherName: string;
  createdAt: string;
}

export interface Section {
  id: string;
  name: string;
  subject: string;
  teacherEmail: string;
  teacherEmails?: string[]; // Multiple teachers assigned via timetable/TeacherSection
  students: Student[];
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  type: 'student' | 'teacher';
  applicantName: string;
  applicantEmail: string;
  studentName?: string;
  studentRollNo?: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedBy?: string;
  sectionId?: string;
  teacherSubject?: string;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  subject: string;
  section: string;
  accessCode: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

export interface TimetableSlot {
  subject: string;
  teacherEmail: string;
  teacherName: string;
}

export interface Timetable {
  id: string;
  sectionId: string;
  sectionName: string;
  periodsPerDay: number;
  days: string[];
  grid: Record<string, TimetableSlot[]>;
  createdAt: string;
}

export interface Substitution {
  id: string;
  timetableId: string;
  sectionName: string;
  day: string;
  periodIndex: number;
  subject: string;
  absentTeacherEmail: string;
  absentTeacherName: string;
  substituteTeacherEmail?: string;
  substituteTeacherName?: string;
  status: 'pending' | 'assigned';
  leaveRequestId: string;
  date: string;
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
  targetRole: 'admin' | 'teacher' | 'parent' | 'all';
  targetEmail?: string;
}

export interface AuditLogEntry {
  id: string;
  actionType: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
}

export interface FailedMessage {
  id: string;
  parentName: string;
  studentName: string;
  phone: string;
  status: 'failed' | 'pending' | 'sent';
  reason?: string;
}

export interface OCRResult {
  id: string;
  imageFile: string;
  extractedRollNo: string;
  extractedMarks: string;
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  matchedStudentId?: number;
  matchedStudentName?: string;
  matchedParentPhone?: string;
  imageUrl?: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  maxStudents: number;
  maxMessagesPerMonth: number;
  messagesUsedThisMonth: number;
  validTill: string;
  aiInsightsEnabled: boolean;
}

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'free',
  maxStudents: 50,
  maxMessagesPerMonth: 100,
  messagesUsedThisMonth: 0,
  validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  aiInsightsEnabled: false,
};

interface AppDataContextType {
  schoolInfo: SchoolInfo | null;
  setSchoolInfo: React.Dispatch<React.SetStateAction<SchoolInfo | null>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  attendanceCorrections: AttendanceCorrection[];
  setAttendanceCorrections: React.Dispatch<React.SetStateAction<AttendanceCorrection[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  teacherAccounts: TeacherAccount[];
  setTeacherAccounts: React.Dispatch<React.SetStateAction<TeacherAccount[]>>;
  timetables: Timetable[];
  setTimetables: React.Dispatch<React.SetStateAction<Timetable[]>>;
  substitutions: Substitution[];
  setSubstitutions: React.Dispatch<React.SetStateAction<Substitution[]>>;
  notifications: Notification[];
  addNotification: (msg: string, type: 'success' | 'error' | 'info', targetRole?: 'admin' | 'teacher' | 'parent' | 'all', targetEmail?: string) => void;
  markNotificationRead: (id: string) => void;
  messagesSent: number;
  setMessagesSent: React.Dispatch<React.SetStateAction<number>>;
  auditLogs: AuditLogEntry[];
  addAuditLog: (actionType: string, userName: string, userRole: string, details: string) => void;
  failedMessages: FailedMessage[];
  setFailedMessages: React.Dispatch<React.SetStateAction<FailedMessage[]>>;
  getNextStudentId: () => string;
  subscription: SubscriptionInfo;
  setSubscription: React.Dispatch<React.SetStateAction<SubscriptionInfo>>;
  canAddStudents: (count: number) => boolean;
  canSendMessages: (count: number) => boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<TeacherAccount[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messagesSent, setMessagesSent] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);

  const addNotification = useCallback((msg: string, type: 'success' | 'error' | 'info', targetRole: 'admin' | 'teacher' | 'parent' | 'all' = 'all', targetEmail?: string) => {
    setNotifications(prev => [{
      id: crypto.randomUUID(),
      message: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
      targetRole,
      targetEmail,
    }, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const addAuditLog = useCallback((actionType: string, userName: string, userRole: string, details: string) => {
    setAuditLogs(prev => [{
      id: crypto.randomUUID(),
      actionType,
      userName,
      userRole,
      details,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const getNextStudentId = useCallback(() => {
    const allStudents = sections.flatMap(s => s.students);
    const count = allStudents.length + 1;
    const code = schoolInfo?.schoolCode || 'EDU';
    return `${code}_${String(count).padStart(4, '0')}`;
  }, [sections, schoolInfo]);

  const totalStudents = sections.reduce((acc, s) => acc + s.students.length, 0);

  const canAddStudents = useCallback((count: number) => {
    return totalStudents + count <= subscription.maxStudents;
  }, [totalStudents, subscription.maxStudents]);

  const canSendMessages = useCallback((count: number) => {
    return subscription.messagesUsedThisMonth + count <= subscription.maxMessagesPerMonth;
  }, [subscription.messagesUsedThisMonth, subscription.maxMessagesPerMonth]);

  return (
    <AppDataContext.Provider value={{
      schoolInfo, setSchoolInfo,
      attendanceRecords, setAttendanceRecords,
      attendanceCorrections, setAttendanceCorrections,
      students, setStudents,
      sections, setSections,
      leaveRequests, setLeaveRequests,
      teacherAccounts, setTeacherAccounts,
      timetables, setTimetables,
      substitutions, setSubstitutions,
      notifications, addNotification, markNotificationRead,
      messagesSent, setMessagesSent,
      auditLogs, addAuditLog,
      failedMessages, setFailedMessages,
      getNextStudentId,
      subscription, setSubscription,
      canAddStudents, canSendMessages,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be inside AppDataProvider');
  return ctx;
};
