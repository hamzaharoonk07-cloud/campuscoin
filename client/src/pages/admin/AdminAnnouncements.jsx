import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Icon from '../../components/Icon.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { useToast } from '../../context/AppContext.jsx';

const BLANK = { title: '', body: '', kind: 'announcement' };

export default function AdminAnnouncements() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get('/admin/announcements')
      .then(({ announcements }) => setItems(announcements))
      .catch((err) => toast.error('Could not load these', err.message));
  }, [toast]);

  useEffect(load, [load]);

  const publish = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/announcements', form);
      toast.success(
        form.kind === 'announcement' ? 'Posted to every student' : 'Tip template added',
        form.kind === 'announcement' ? 'It is in their alerts now.' : undefined
      );
      setForm(BLANK);
      load();
    } catch (err) {
      toast.error('Could not post it', err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item) => {
    try {
      await api.patch(`/admin/announcements/${item._id}`, { active: !item.active });
      load();
    } catch (err) {
      toast.error('Could not update it', err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await api.del(`/admin/announcements/${item._id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error('Could not delete it', err.message);
    }
  };

  return (
    <Layout title="Announcements and tip templates">
      <div className="grid grid-main">
        <section className="panel">
          <div className="panel-head">
            <h2>Posted</h2>
          </div>
          <div className="panel-body">
            {items.length === 0 ? (
              <div className="empty">
                <h3>Nothing posted yet</h3>
                <p>Announcements reach every student&rsquo;s alerts. Tip templates sit alongside their own tips.</p>
              </div>
            ) : (
              items.map((item) => (
                <div className="tip" key={item._id} style={{ opacity: item.active ? 1 : 0.55 }}>
                  <span className="tip-impact" style={{ background: 'var(--raised)', color: 'var(--muted)' }}>
                    <Icon name={item.kind === 'announcement' ? 'bell' : 'bulb'} size={15} />
                  </span>
                  <div>
                    <h4>
                      {item.title}
                      {!item.active ? (
                        <span className="pill" style={{ marginLeft: '0.5rem' }}>
                          hidden
                        </span>
                      ) : null}
                    </h4>
                    <p>{item.body}</p>
                    <div className="tip-actions">
                      <span className="small muted">
                        {item.kind === 'announcement' ? 'Announcement' : 'Tip template'} &middot;{' '}
                        {formatDate(item.createdAt)}
                      </span>
                      <button type="button" className="btn btn-ghost btn-sm push" onClick={() => toggle(item)}>
                        {item.active ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(item)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Write a new one</h3>
          </div>
          <div className="panel-body">
            <form className="stack" onSubmit={publish}>
              <div className="seg" role="group" aria-label="Kind">
                <button type="button" aria-pressed={form.kind === 'announcement'} onClick={() => setForm({ ...form, kind: 'announcement' })}>
                  Announcement
                </button>
                <button type="button" aria-pressed={form.kind === 'tip-template'} onClick={() => setForm({ ...form, kind: 'tip-template' })}>
                  Tip template
                </button>
              </div>

              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="body">Message</label>
                <textarea
                  id="body"
                  required
                  rows={5}
                  maxLength={1000}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {form.kind === 'announcement' ? 'Post to all students' : 'Add tip template'}
              </button>

              <p className="small muted">
                {form.kind === 'announcement'
                  ? 'This lands in every active student’s alerts straight away, so keep it to things that are genuinely worth interrupting for.'
                  : 'Tip templates show on the saving tips page under "From your college", alongside the tips built from each student’s own numbers.'}
              </p>
            </form>
          </div>
        </section>
      </div>
    </Layout>
  );
}
