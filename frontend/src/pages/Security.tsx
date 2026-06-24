import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Security() {
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
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm tracking-tight text-white">Trust & Security</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase mb-4">Trust Center</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Security Architecture</h1>
          <p className="text-lg text-slate-400 font-light leading-relaxed">
            EduAuto Pro is built on the philosophy that school data is highly sensitive. We have engineered our backend using strict role-based isolation, multi-tenant database designs, and immutable audit trails to ensure absolute data integrity.
          </p>
        </div>

        <div className="space-y-12 text-slate-300 font-light leading-relaxed">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Role-Based Access Control (RBAC)</h2>
            </div>
            <p className="mb-4">
              Our system enforces strict authentication middleware at the routing layer. Users are classified into three immutable roles:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-400">
              <li><strong>Administrators:</strong> Have full oversight, capability to generate bulk reports, and view audit logs.</li>
              <li><strong>Teachers:</strong> Are restricted specifically to the Sections they are assigned to. A teacher cannot view or grade students in unassigned classes.</li>
              <li><strong>Parents:</strong> Access is rigidly locked to their specific child's `student_id`. A parent portal can only query data relevant to that exact student.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Immutable Audit Trails</h2>
            </div>
            <p>
              To prevent unauthorized changes and provide total accountability, EduAuto maintains an immutable `AuditLog` table. Every single state-changing request (POST, PUT, DELETE) executed by an Admin or Teacher is automatically logged. This includes the exact action taken, the timestamp, and the `user_id` of the person who initiated it. These logs cannot be deleted, even by Administrators.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Data Isolation (Multi-Tenancy)</h2>
            </div>
            <p>
              EduAuto serves multiple schools from a unified codebase, but data is strictly isolated at the database schema level using Prisma ORM. Every sensitive query executed by the backend automatically requires and validates the `school_id` token. A cross-tenant data leak is architecturally impossible.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Encryption & Infrastructure</h2>
            </div>
            <p className="mb-4">
              All data transmitted between the client and the EduAuto servers is encrypted via TLS/SSL. Passwords are never stored in plain text; they are hashed securely before being written to the PostgreSQL database.
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
