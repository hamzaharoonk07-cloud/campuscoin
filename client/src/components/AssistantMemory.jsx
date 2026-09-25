import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import CoinBot from './CoinBot.jsx';
import { api } from '../lib/api.js';
import { slotColor } from '../lib/format.js';
import { useToast } from '../context/AppContext.jsx';

/**
 * What the categorisation assistant has learned about this student, shown in
 * Settings. It exists because a suggestion whose workings cannot be seen is
 * one that cannot be judged: this shows the words it has picked up, how often
 * its guesses were kept, and lets the student wipe it and start again.
 */
export default function AssistantMemory() {
  const toast = useToast();
  const [status, setStatus] = useState(null);

  const load = useCallback(() => {
    api
      .get('/ai/status')
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(load, [load]);

  const forget = async () => {
    if (!window.confirm('Clear everything Coin has learned about your spending?')) return;
    try {
      const { message } = await api.del('/ai/memory');
      toast.success(message);
      load();
    } catch (err) {
      toast.error('Could not clear it', err.message);
    }
  };

  const learning = status?.categorisation;
  const accuracy = learning?.accuracy;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>What Coin has learned</h2>
      </div>
      <div className="panel-body stack">
        <div className="memory-head">
          <CoinBot size={52} />
          <p className="small muted" style={{ margin: 0 }}>
            Every description you save teaches Coin which words mean which category. Correcting a suggestion is how
            it improves. None of this is shared, and suggestions are never financial advice.
          </p>
        </div>

        <div className="memory-stats">
          <div>
            <strong className="num">{learning?.wordsLearned ?? 0}</strong>
            <span>words learned</span>
          </div>
          <div>
            <strong className="num">{accuracy?.rate === null || accuracy === undefined ? '--' : `${accuracy.rate}%`}</strong>
            <span>{accuracy?.total ? `suggestions kept, of ${accuracy.total}` : 'none judged yet'}</span>
          </div>
        </div>

        {learning?.examples?.length ? (
          <div className="row row-wrap">
            {learning.examples.slice(0, 9).map((row) => (
              <span className="pill" key={`${row.word}-${row.category}`}>
                <i className="swatch" style={{ background: slotColor(row.slot) }} />
                {row.word} &rarr; {row.category}
              </span>
            ))}
          </div>
        ) : null}

        <button type="button" className="btn btn-danger btn-sm" style={{ justifySelf: 'start' }} onClick={forget}>
          <Icon name="trash" size={14} />
          Make Coin forget everything
        </button>
      </div>
    </section>
  );
}
