import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import Chat from '../components/Chat.jsx';
import { CategoryIcon, ChatArt } from '../components/Illustrations.jsx';
import { CountNumber } from '../components/CountUp.jsx';
import { api } from '../lib/api.js';
import { slotColor } from '../lib/format.js';
import { useToast } from '../context/AppContext.jsx';

/**
 * The assistant's home: the chat, plus a page about the assistant itself. The
 * second half exists because a suggestion a student cannot see the workings of
 * is one they cannot judge - so it shows what it has learned, how often it was
 * right, and how to make it forget.
 */
export default function Assistant() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [probe, setProbe] = useState('');
  const [guess, setGuess] = useState(null);

  const load = useCallback(() => {
    api
      .get('/ai/status')
      .then(setStatus)
      .catch((err) => toast.error('Could not load the assistant', err.message));
  }, [toast]);

  useEffect(load, [load]);

  useEffect(() => {
    const text = probe.trim();
    if (text.length < 3) {
      setGuess(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      api
        .get(`/ai/suggest?q=${encodeURIComponent(text)}&type=expense`)
        .then(({ suggestion }) => setGuess(suggestion))
        .catch(() => setGuess(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [probe]);

  const forget = async () => {
    if (!window.confirm('Clear everything the assistant has learned about your spending?')) return;
    try {
      const { message } = await api.del('/ai/memory');
      toast.success(message);
      load();
      setGuess(null);
    } catch (err) {
      toast.error('Could not clear it', err.message);
    }
  };

  const accuracy = status?.categorisation?.accuracy;

  return (
    <Layout
      title="AI assistant"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>AI assistant</span>
        </>
      }
    >
      <div className="grid grid-main">
        <div className="stack">
          <section className="panel chat-panel">
            <div className="panel-head">
              <h2>Ask Campus Coin</h2>
              <span className="panel-note">Answers come from your own transactions</span>
            </div>
            <Chat />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Try the categoriser</h2>
              <span className="panel-note">Nothing is saved from this box</span>
            </div>
            <div className="panel-body stack">
              <div className="field">
                <label htmlFor="probe">Type a description, the way you would when logging something</label>
                <input
                  id="probe"
                  placeholder="chai and paratha at the canteen"
                  value={probe}
                  onChange={(e) => setProbe(e.target.value)}
                />
              </div>

              {guess ? (
                <div className="panel" style={{ padding: '1rem 1.15rem', background: 'var(--raised)' }}>
                  <div className="row">
                    <CategoryIcon icon={guess.icon} slot={guess.slot} size={42} />
                    <div>
                      <strong>{guess.name}</strong>
                      <div className="small muted">
                        {Math.round(guess.confidence * 100)}% sure, from {guess.reason}
                      </div>
                    </div>
                  </div>
                  {guess.alternatives?.length ? (
                    <p className="small muted" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      It also considered{' '}
                      {guess.alternatives.map((alt, i) => (
                        <span key={alt._id}>
                          {i > 0 ? ' and ' : ''}
                          {alt.name} ({Math.round(alt.confidence * 100)}%)
                        </span>
                      ))}
                      .
                    </p>
                  ) : null}
                </div>
              ) : probe.trim().length >= 3 ? (
                <p className="muted small">
                  Nothing in those words matches a category yet. Choose one manually when you log it and the assistant
                  will remember.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h3>How it works</h3>
            </div>
            <div className="panel-body stack">
              <ChatArt />
              <p className="muted small">
                There are three separate pieces, and only one of them can involve a language model.
              </p>

              <div>
                <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', marginBottom: '0.25rem' }}>
                  Answering your questions
                </h4>
                <p className="muted small">
                  The chat recognises the kind of question you are asking, such as your balance, a category, a budget or
                  the forecast, and answers it from the same calculations the reports use, so the two always agree.
                  {status?.narrativeInsights?.enabled
                    ? ' A question it does not recognise is passed to Claude along with your figures, and Claude is told to use nothing else.'
                    : ' Questions it does not recognise get a list of things it can answer.'}
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', marginBottom: '0.25rem' }}>
                  Categorising what you type
                </h4>
                <p className="muted small">
                  This runs entirely on Campus Coin&rsquo;s own server. Each word of a description is counted against
                  the category you actually chose, which builds a word-to-category table that belongs to you alone.
                  Correcting a suggestion is what teaches it: the correction records a different pairing than the one
                  it proposed, so the next guess leans the other way. New accounts start from a list of seed keywords
                  until they have a history of their own.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--step-0)', marginBottom: '0.25rem' }}>
                  Writing the monthly summary
                </h4>
                <p className="muted small">
                  {status?.narrativeInsights?.note}{' '}
                  Either way Campus Coin calculates every figure first and the model only rewrites them, so a summary
                  can never disagree with your report.
                </p>
              </div>

              <p className="small muted">
                Suggestions are always overridable and are never treated as certified financial advice.
              </p>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>What it has learned</h3>
            </div>
            <div className="panel-body stack">
              <div className="stat-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat">
                  <div className="stat-label">Words learned</div>
                  <div className="stat-value num"><CountNumber value={status?.categorisation?.wordsLearned ?? 0} /></div>
                </div>
                <div className="stat">
                  <div className="stat-label">Suggestions kept</div>
                  <div className="stat-value num">{accuracy?.rate === null || accuracy === undefined ? '--' : `${accuracy.rate}%`}</div>
                  <div className="stat-meta">
                    {accuracy?.total ? `across ${accuracy.total} judged` : 'none judged yet'}
                  </div>
                </div>
              </div>

              {status?.categorisation?.examples?.length ? (
                <div>
                  <h4 className="small muted" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    Strongest associations
                  </h4>
                  <div className="row row-wrap">
                    {status.categorisation.examples.map((row) => (
                      <span className="pill" key={`${row.word}-${row.category}`}>
                        <i className="swatch" style={{ background: slotColor(row.slot) }} />
                        {row.word} &rarr; {row.category}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="muted small">Log a few transactions and the words it picks up will show here.</p>
              )}

              <button type="button" className="btn btn-danger btn-sm" onClick={forget}>
                <Icon name="trash" size={15} />
                Make it forget everything
              </button>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
