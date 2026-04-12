import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import ocrRoutes from './routes/ocr.routes';
import resultsRoutes from './routes/results.routes';
import schoolRoutes from './routes/school.routes';
import timetableRoutes from './routes/timetable.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import messagesRoutes from './routes/messages.routes';
import subscriptionRoutes from './routes/subscription.routes';

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/ocr', ocrRoutes);
app.use('/timetable', timetableRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/leaves', leaveRoutes);
app.use('/results', resultsRoutes);
app.use('/school', schoolRoutes);
app.use('/messages', messagesRoutes);
app.use('/subscription', subscriptionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EduAuto SaaS Backend running on port ${PORT}`);
});
