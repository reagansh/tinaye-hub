'use client';

import React, { useState, useEffect } from 'react';
import { ZIMSEC_SHONA_CURRICULUM } from '@/lib/curriculum/zimsec-framework';
import { generateSocraticHint, SocraticHintResponse } from '@/lib/pedagogy/socratic-hints';
import { OfflineSyncManager } from '@/lib/offline/sync-manager';

export default function HomePage() {
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeChildName, setActiveChildName] = useState<string>('Farai');
  const [streakCount, setStreakCount] = useState<number>(4);
  const [xp, setXp] = useState<number>(240);

  // Practice Arena State
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [socraticFeedback, setSocraticFeedback] = useState<SocraticHintResponse | null>(null);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);

  // Modals
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [showParentModal, setShowParentModal] = useState<boolean>(false);
  const [showReportPreview, setShowReportPreview] = useState<boolean>(false);

  // Billing form state
  const [donationAmount, setDonationAmount] = useState<string>('5.00');
  const [billingLoading, setBillingLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      OfflineSyncManager.registerNetworkListeners('child_farai_demo');

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const topicsForGrade = ZIMSEC_SHONA_CURRICULUM.filter(
    (t) => t.gradeLevel === selectedGrade
  );
  const activeTopic = topicsForGrade[selectedTopicIndex] || topicsForGrade[0] || ZIMSEC_SHONA_CURRICULUM[0];
  const activeLesson = activeTopic.sampleLessons[0];
  const activeExercise = activeLesson?.exercises[0];

  const handleSelectAnswer = (option: string) => {
    if (isSubmitted && isCorrect) return;
    setSelectedAnswer(option);
    setIsSubmitted(false);
    setSocraticFeedback(null);
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || !activeExercise) return;

    const correct = selectedAnswer === activeExercise.payload.correctAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      setXp((prev) => prev + 15);
      setSocraticFeedback(null);

      // Record offline / online sync
      await OfflineSyncManager.recordAttemptLocally({
        childId: 'child_farai_demo',
        exerciseId: activeExercise.id,
        isCorrect: true,
        chosenAnswer: selectedAnswer,
        hintsUsedCount: hintLevel,
        timeSpentSeconds: 25,
        offlineTimestamp: new Date().toISOString(),
      });
    } else {
      // Generate compassionate Socratic guidance in Shona
      const hint = generateSocraticHint({
        questionShona: activeExercise.questionShona,
        userAnswer: selectedAnswer,
        correctAnswer: activeExercise.payload.correctAnswer,
        category: activeTopic.category,
        currentHintLevel: hintLevel,
        staticHints: activeExercise.socraticHints,
      });

      setSocraticFeedback(hint);
      setHintLevel((prev) => prev + 1);

      await OfflineSyncManager.recordAttemptLocally({
        childId: 'child_farai_demo',
        exerciseId: activeExercise.id,
        isCorrect: false,
        chosenAnswer: selectedAnswer,
        hintsUsedCount: hintLevel + 1,
        timeSpentSeconds: 30,
        offlineTimestamp: new Date().toISOString(),
      });
    }
  };

  const handleTriggerStripe = async (type: 'MICRO_1USD' | 'DONATION') => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountInDollars: type === 'DONATION' ? parseFloat(donationAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to redirect to checkout');
      }
    } catch (err: any) {
      alert('Checkout error: ' + err.message);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <header className="navbar">
        <a href="#" className="brand">
          <div className="brand-logo">T</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-name">Tinaye-Hub</span>
              <span className="brand-badge">ZIMSEC Primary</span>
            </div>
          </div>
        </a>

        <div className="nav-actions">
          {/* Online/Offline status pill */}
          <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
            <span className="pulse-dot" />
            <span>{isOnline ? 'Masaisai Arikushanda (Online)' : 'Wadzima Dandemutande (Offline-Ready)'}</span>
          </div>

          {/* Child Profile & Gamification Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#132238',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #223a5e',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
              &#128293; {streakCount} Days
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
              &#11088; {xp} XP
            </span>
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
              {activeChildName} (G{selectedGrade})
            </span>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setShowReportPreview(true)}
            title="View Weekly Parent Analytics Digest"
          >
            &#128202; Parent Report
          </button>

          <button className="btn btn-gold" onClick={() => setShowBillingModal(true)}>
            $1/Mo or Donate
          </button>
        </div>
      </header>

      {/* Grade Level Selector (Grades 1 to 7) */}
      <nav className="grade-bar">
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginRight: '6px' }}>
          Sarudza Giredhi (Select Grade):
        </span>
        {[1, 2, 3, 4, 5, 6, 7].map((grade) => (
          <button
            key={grade}
            className={`grade-pill ${selectedGrade === grade ? 'active' : ''}`}
            onClick={() => {
              setSelectedGrade(grade);
              setSelectedTopicIndex(0);
              setSelectedAnswer(null);
              setIsSubmitted(false);
              setSocraticFeedback(null);
              setHintLevel(0);
            }}
          >
            {grade <= 2
              ? `Grade ${grade} (Foundation)`
              : grade <= 4
              ? `Grade ${grade} (Development)`
              : `Grade ${grade} (Mastery)`}
          </button>
        ))}
      </nav>

      <main className="container">
        {/* Hero Section */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1>Dzidzo yeChiShona: Giredhi {selectedGrade}</h1>
            <p>
              Pedagogical framework modeled after Khan Academy, aligned with ZIMSEC primary learning objectives.
              Designed with offline-first caching for zero-data rural access, compassionate Socratic Shona hints,
              and automated weekly progress reporting for parents.
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
              &#10003; 100% Copyright-Safe Original Material
            </span>
            <span style={{ fontSize: '0.85rem', color: '#fde68a' }}>
              &#10003; Compassionate Socratic Hint AI
            </span>
            <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
              &#10003; Auto Parent Email Digest every Sunday
            </span>
          </div>
        </div>

        {/* Khan Academy-Style Unit / Competency Grid */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '18px', color: '#ffffff' }}>
          Zvidzidzo zveGiredhi {selectedGrade} (Curriculum Units)
        </h2>

        <div className="topic-grid">
          {topicsForGrade.map((topic, idx) => (
            <div
              key={topic.code}
              className="topic-card"
              style={{
                borderColor: selectedTopicIndex === idx ? 'var(--emerald-primary)' : undefined,
                background: selectedTopicIndex === idx ? 'var(--bg-card-hover)' : undefined,
              }}
              onClick={() => {
                setSelectedTopicIndex(idx);
                setSelectedAnswer(null);
                setIsSubmitted(false);
                setSocraticFeedback(null);
                setHintLevel(0);
              }}
            >
              <div className="topic-header">
                <div className="topic-icon">&#128218;</div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                  }}
                >
                  {topic.category.replace('_', ' ')}
                </span>
              </div>
              <h3 className="topic-title-shona">{topic.titleShona}</h3>
              <p className="topic-title-en">{topic.titleEnglish}</p>
              <p className="topic-desc">{topic.description}</p>
              <button
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                {selectedTopicIndex === idx ? 'Chidzidzo Chiri Pano (Active)' : 'Dzidza Izvi (Start)'}
              </button>
            </div>
          ))}
        </div>

        {/* Interactive Exercise Arena */}
        {activeExercise && (
          <section className="arena-card">
            <div className="arena-title">
              <div>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                  {activeTopic.titleShona} &bull; Chidzidzo 1
                </span>
                <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginTop: '4px' }}>
                  {activeLesson.title}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Competency: <strong>{activeExercise.targetCompetencyCode}</strong>
                </span>
              </div>
            </div>

            {/* Pedagogical Explanation Card */}
            <div
              style={{
                background: '#0a1424',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #1e3352',
              }}
            >
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '8px' }}>
                {activeLesson.content.introShona}
              </p>
              <ul style={{ paddingLeft: '20px', color: '#94a3b8', fontSize: '0.88rem' }}>
                {activeLesson.content.rulesSummary.map((rule, rIdx) => (
                  <li key={rIdx}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Question */}
            <p className="question-prompt">{activeExercise.questionShona}</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '18px' }}>
              {activeExercise.instructionsShona}
            </p>

            {/* Multiple Choice Options */}
            {activeExercise.payload.options && (
              <div className="options-grid">
                {activeExercise.payload.options.map((opt) => {
                  let statusClass = '';
                  if (selectedAnswer === opt) {
                    statusClass = 'selected';
                    if (isSubmitted) {
                      statusClass = isCorrect ? 'correct' : 'incorrect';
                    }
                  } else if (isSubmitted && opt === activeExercise.payload.correctAnswer) {
                    statusClass = 'correct';
                  }

                  return (
                    <button
                      key={opt}
                      className={`option-btn ${statusClass}`}
                      onClick={() => handleSelectAnswer(opt)}
                    >
                      <span>{opt}</span>
                      {selectedAnswer === opt && (
                        <span>{isSubmitted ? (isCorrect ? '&#10003;' : '&#10007;') : '&#9679;'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill-in-Blank / Text prompt */}
            {activeExercise.type === 'FILL_BLANK' && (
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Nyora mhinduro yako pano..."
                  value={selectedAnswer || ''}
                  onChange={(e) => {
                    setSelectedAnswer(e.target.value);
                    setIsSubmitted(false);
                    setSocraticFeedback(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#17273f',
                    border: '2px solid #233a5d',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                  }}
                />
              </div>
            )}

            {/* Check Button & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer}
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                Tarisa Mhinduro (Check Answer)
              </button>

              {isCorrect && (
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                  &#127881; Makorokoto! Wawana mhinduro chaiyo (+15 XP)
                </div>
              )}
            </div>

            {/* Compassionate Socratic Hint Display */}
            {socraticFeedback && (
              <div className="socratic-box">
                <div className="socratic-header">
                  &#129300; Rubatsiro rweMudzidzisi (Socratic Shona Guidance) &bull; Level {socraticFeedback.nextHintLevel}
                </div>
                <div className="socratic-encouragement">{socraticFeedback.encouragementShona}</div>
                <p className="socratic-hint-text">{socraticFeedback.hintShona}</p>
                {socraticFeedback.hasMoreHints && (
                  <button
                    onClick={handleCheckAnswer}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f59e0b',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      marginTop: '8px',
                      padding: 0,
                    }}
                  >
                    Ndinoda chimwe chiratidzo (Need another clue?)
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Parent Weekly Digest Preview Modal */}
      {showReportPreview && (
        <div className="modal-overlay" onClick={() => setShowReportPreview(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Gwaro reMubereki (Weekly Digest Preview)</h2>
              <button
                onClick={() => setShowReportPreview(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '20px' }}>
              Every Sunday at 18:00 CAT (16:00 UTC), Tinaye-Hub automatically runs via Vercel Cron, compiles your child's progress, and sends this formatted email report to registered parents:
            </p>

            <div style={{ background: '#ffffff', color: '#1e293b', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Farai &bull; Grade 3</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ZIMSEC Primary Shona</span>
                </div>
                <div style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem' }}>
                  Streak: 4 Days
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>8</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ZVIDZIDZO</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>45m</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NGUVA</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>82%</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>KUGONA</div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                  &#9989; Zvaakaita Zvakanaka (Strengths):
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  &bull; Mipanda 1 ne 2 (Mu-/Va-) - 100% accuracy<br />
                  &bull; Kudanwa kweMabhii eInzwi - 94% accuracy
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>
                  &#9888;&#65039; Zvinoda Dzokororo (Focus Area):
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  &bull; Mupanda 3 ne 4 (Mu-/Mi- zvirimwa nezvinhu) - Needs review
                </div>
              </div>

              <div style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>ZANO REMUBEREKI (COACHING TIP):</div>
                <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                  Tsvagai maminitsi gumi manheru ano muchitarisa zvirimwa nemiti iri pamba ("Muti -&gt; Miti").
                </div>
              </div>
            </div>

            <button
              className="btn btn-outline"
              onClick={() => setShowReportPreview(false)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Vhara (Close Preview)
            </button>
          </div>
        </div>
      )}

      {/* Stripe $1/Mo & Donation Modal */}
      {showBillingModal && (
        <div className="modal-overlay" onClick={() => setShowBillingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Flexible Support &amp; Sponsorship</h2>
              <button
                onClick={() => setShowBillingModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '24px' }}>
              Tinaye-Hub is built to be accessible to every Zimbabwean family. Choose a low-cost family plan or donate to sponsor rural learners.
            </p>

            {/* Micro-Subscription Option */}
            <div
              style={{
                background: '#17273f',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Micro-Subscription</h3>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>$1.00 / month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                Full family access for up to 5 child profiles, unlimited offline downloads, and automated weekly parent reports.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={billingLoading}
                onClick={() => handleTriggerStripe('MICRO_1USD')}
              >
                {billingLoading ? 'Processing...' : 'Subscribe for $1.00 / Month'}
              </button>
            </div>

            {/* Pay-What-You-Want Donation Option */}
            <div
              style={{
                background: '#17273f',
                border: '1px solid #233a5d',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Community Donation</h3>
                <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700 }}>Pay-What-You-Want</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
                Sponsor bandwidth and offline learning kits for underprivileged students in Zimbabwe.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {['2.00', '5.00', '10.00', '25.00'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`btn ${donationAmount === amt ? 'btn-gold' : 'btn-outline'}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setDonationAmount(amt)}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-gold"
                style={{ width: '100%' }}
                disabled={billingLoading}
                onClick={() => handleTriggerStripe('DONATION')}
              >
                {billingLoading ? 'Processing...' : `Donate $${donationAmount} Once`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
