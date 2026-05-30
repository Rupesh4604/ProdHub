import React from 'react';

export default function LandingPage() {
  const features = [
    {
      icon: '✅',
      title: 'Task Management',
      desc: 'Organise tasks by project, set deadlines, and track progress across everything you\'re working on.',
    },
    {
      icon: '🔥',
      title: 'Habit Tracker',
      desc: 'Build lasting habits with daily check-ins, streak tracking, and a monthly calendar view.',
    },
    {
      icon: '🎯',
      title: 'Goals',
      desc: 'Set meaningful goals, break them into milestones, and measure your progress over time.',
    },
    {
      icon: '📅',
      title: 'Schedule & Calendar',
      desc: 'See all your tasks and events in one place. Optionally sync with Google Calendar.',
    },
    {
      icon: '📊',
      title: 'Weekly Review',
      desc: 'Reflect on your week with an auto-generated summary of completed tasks and habit streaks.',
    },
    {
      icon: '📁',
      title: 'Project Hub',
      desc: 'Group related tasks into projects and get a clear bird\'s-eye view of every initiative.',
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#0f1117',
        color: '#e2e8f0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          height: '60px',
          borderBottom: '1px solid #1e293b',
          background: 'rgba(15,17,23,0.9)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.15rem', color: '#60a5fa' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          ProdHub
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="https://my-productivity-hub-5a3ba.web.app/privacy.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>Privacy</a>
          <a href="https://my-productivity-hub-5a3ba.web.app/terms.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>Terms</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          textAlign: 'center',
          padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)',
          background: 'linear-gradient(180deg, #0f172a 0%, #0f1117 100%)',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.25)',
            color: '#60a5fa',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.3rem 0.85rem',
            borderRadius: '999px',
            marginBottom: '1.25rem',
          }}
        >
          🚀 Your All-in-One Productivity Hub
        </div>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            color: '#f1f5f9',
            lineHeight: 1.15,
            letterSpacing: '-0.8px',
            marginBottom: '1rem',
            maxWidth: '700px',
            margin: '0 auto 1rem',
          }}
        >
          Manage Tasks, Habits &amp; Goals —<br />
          <span style={{ color: '#60a5fa' }}>All in One Place</span>
        </h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            maxWidth: '600px',
            margin: '0 auto 2rem',
            lineHeight: 1.7,
          }}
        >
          <strong>The purpose of ProdHub</strong> is to provide a comprehensive workflow application that brings your daily tasks, long-term goals, habit tracking, and project management together in a single dashboard—helping you stay organized without logging into multiple tools.
        </p>
        <a
          href="#login"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: '0.75rem 2rem',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
          }}
        >
          Get Started Free →
        </a>
      </section>

      {/* ── Features grid ── */}
      <section
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'clamp(2.5rem, 6vw, 4.5rem) 1.5rem',
          width: '100%',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: '0.5rem',
            letterSpacing: '-0.4px',
          }}
        >
          Everything you need to stay on top
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Six powerful modules. One seamless experience.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#1a1f2e',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call to action ── */}
      <section
        style={{
          background: '#111827',
          borderTop: '1px solid #1e293b',
          borderBottom: '1px solid #1e293b',
          padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to organize your life?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Create a free account to start managing your daily objectives, building robust habits, and tracking your long-term goals.
          </p>
          <a
            href="#login"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '10px',
              padding: '1rem 2.5rem',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Sign In / Sign Up
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid #1e293b',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#475569',
          marginTop: 'auto',
        }}
      >
        <p style={{ marginBottom: '0.4rem' }}>&copy; 2026 ProdHub — Open-source productivity for everyone.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
          <a href="https://my-productivity-hub-5a3ba.web.app/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="https://my-productivity-hub-5a3ba.web.app/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</a>
          <a href="https://github.com/Rupesh4604/ProdHub" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
