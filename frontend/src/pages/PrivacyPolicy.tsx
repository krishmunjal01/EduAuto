import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 -ml-4" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm tracking-tight text-white">Privacy Policy</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase mb-4">Effective Date: June 2026</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Privacy Policy</h1>
          <p className="text-lg text-slate-400 font-light leading-relaxed">
            EduAuto Pro ("we", "our", or "us") is committed to protecting the privacy of the schools, teachers, students, and parents who use our AI-powered school operating system. This policy outlines how we collect, process, and protect your data.
          </p>
        </div>

        <div className="space-y-12 text-slate-300 font-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect information strictly necessary to provide our educational management services:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-400">
              <li><strong>Account Information:</strong> Names, emails, and role designations (Admin, Teacher, Parent) for secure authentication.</li>
              <li><strong>Academic Data:</strong> Student roll numbers, attendance records, test marks, and timetable schedules.</li>
              <li><strong>Communication Data:</strong> Parent phone numbers, utilized exclusively for delivering automated WhatsApp and Voice notifications regarding their specific child.</li>
              <li><strong>Media & Documents:</strong> Images of handwritten test sheets uploaded by teachers for the purpose of Optical Character Recognition (OCR) grading.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Process Data (OCR & AI)</h2>
            <p className="mb-4">EduAuto utilizes advanced AI algorithms to automate administrative workflows. You should know how this data is handled:</p>
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-xl space-y-4">
              <div>
                <h3 className="font-semibold text-white">Optical Character Recognition (OCR)</h3>
                <p className="text-sm text-slate-400">When test sheets are uploaded, our proprietary OCR pipeline extracts roll numbers and marks. These images are processed ephemerally and are not used to train generic machine learning models.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Generative AI Feedback</h3>
                <p className="text-sm text-slate-400">We utilize Google GenAI integrations to analyze student performance metrics and generate personalized parent-teacher feedback. This data is transmitted securely and is subject to strict enterprise data-processing agreements.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Isolation & Multi-Tenancy</h2>
            <p>
              EduAuto operates on a strict multi-tenant architecture. Every piece of data collected is cryptographically bound to your specific `school_id`. It is architecturally impossible for users of one school to query, view, or access the data of another school using our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. WhatsApp & Voice Integrations</h2>
            <p>
              Parent phone numbers are utilized strictly for transactional notifications (e.g., "Attendance Marked", "Results Published"). We do not use phone numbers for marketing purposes, nor do we sell this data to third-party brokers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to request access to, correction of, or deletion of your personal data. Because EduAuto acts as a data processor on behalf of the School (the data controller), parents and students must direct such requests to their school administrators, who have the tools necessary to fulfill these requests via the EduAuto Admin Panel.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-slate-600">
          <p>© 2026 Krish Munjal. Built with cutting-edge tech.</p>
        </div>
      </footer>
    </div>
  );
}
