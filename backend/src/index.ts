import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Allow requests from the Vercel frontend (set FRONTEND_URL in Render env vars)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:8080', 'http://localhost:5173']
  : true; // allow all in dev

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Root — API info
const rootHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    name: 'EduAuto SaaS API',
    version: '1.0.0',
    status: 'running',
    docs: '/health'
  });
};
app.get('/', rootHandler);
app.head('/', rootHandler);

// Healthcheck
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
};
app.get('/health', healthHandler);
app.head('/health', healthHandler);

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
