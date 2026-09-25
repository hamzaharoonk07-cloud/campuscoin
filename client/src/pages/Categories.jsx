import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { TagsArt } from '../components/Illustrations.jsx';
import { Modal } from '../components/TransactionForm.jsx';
import { api } from '../lib/api.js';
import { slotColor } from '../lib/format.js';
import { useToast } from '../context/AppContext.jsx';

const ICONS = ['tag', 'utensils', 'bus', 'home', 'book', 'repeat', 'film', 'wallet', 'briefcase', 'award', 'gift', 'plus-circle'];
const SLOTS = [1, 2, 3, 4, 5, 6, 7];

const BLANK = { name: '', type: 'expense', icon: 'tag', slot: 1, keywords: '' };

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(() => {
    api
      .get('/categories')
      .then(({ categories: list }) => setCategories(list))
      .catch((err) => toast.error('Could not load your categories', err.message));
  }, [toast]);

  useEffect(load, [load]);

  const open = (category) => {
    if (category) {
      setForm({
        name: category.name,
        type: category.type,
        icon: category.icon,
        slot: category.slot,
        keywords: (category.keywords || []).join(', '),
      });
      setEditing(category);
    } else {
      setForm(BLANK);
      setEditing('new');
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      slot: Number(form.slot),
      keywords: form.keywords
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean),
    };
    try {
      if (editing === 'new') {
        await api.post('/categories', payload);
        toast.success(`${payload.name} added`);
      } else {
        await api.patch(`/categories/${editing._id}`, payload);
        toast.success(`${payload.name} updated`);
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save that category', err.message);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      const { message } = await api.del(`/categories/${category._id}`);
      toast.success(message);
      load();
    } catch (err) {
      toast.error('Could not delete it', err.message);
    }
  };

  const mine = categories.filter((c) => c.editable);
  const shared = categories.filter((c) => !c.editable);

  const List = ({ rows, editable }) => (
    <div className="spine">
      {rows.map((category) => (
        <div className="spine-row" key={category._id} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
          <div className="spine-name">
            <span
              className="ledger-dot"
              style={{ background: slotColor(category.slot), width: 26, height: 26 }}
              aria-hidden="true"
            >
              <Icon name={category.icon} size={13} />
            </span>
            <span>{category.name}</span>
            <span className="pill">{category.type === 'income' ? 'in' : 'out'}</span>
          </div>
          <div className="row">
            <span className="small muted nowrap">
              {category.transactionCount} use{category.transactionCount === 1 ? '' : 's'}
            </span>
            {editable ? (
              <>
                <button type="button" className="icon-btn" onClick={() => open(category)} aria-label={`Edit ${category.name}`}>
                  <Icon name="edit" size={15} />
                </button>
                <button type="button" className="icon-btn" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}>
                  <Icon name="trash" size={15} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout
      title="Categories"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Categories</span>
        </>
      }
      actions={
        <button type="button" className="btn btn-primary" onClick={() => open(null)}>
          <Icon name="plus" />
          New category
        </button>
      }
    >
      <section className="panel">
        <div className="panel-head">
          <h2>Your own categories</h2>
          <span className="panel-note">Only you see these</span>
        </div>
        <div className="panel-body">
          {mine.length === 0 ? (
            <div className="empty">
              <TagsArt />
              <h3>You have not added any yet</h3>
              <p>
                The shared categories below cover most student spending. Add your own when something does not fit -
                a society membership, a side project, a family contribution.
              </p>
              <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => open(null)}>
                Add a category
              </button>
            </div>
          ) : (
            <List rows={mine} editable />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Shared categories</h2>
          <span className="panel-note">Set up by the administrator for everyone</span>
        </div>
        <div className="panel-body">
          <List rows={shared} editable={false} />
        </div>
      </section>

      <p className="small muted">
        A category with transactions against it is archived rather than deleted, so your past reports keep adding up.
      </p>

      {editing ? (
        <Modal title={editing === 'new' ? 'New category' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form className="stack" onSubmit={save}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" required maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {editing === 'new' ? (
              <div className="seg" role="group" aria-label="Type">
                <button type="button" aria-pressed={form.type === 'expense'} onClick={() => setForm({ ...form, type: 'expense' })}>
                  Money out
                </button>
                <button type="button" aria-pressed={form.type === 'income'} onClick={() => setForm({ ...form, type: 'income' })}>
                  Money in
                </button>
              </div>
            ) : null}

            <div className="field">
              <label>Colour</label>
              <div className="row row-wrap">
                {SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-label={`Colour ${slot}`}
                    aria-pressed={Number(form.slot) === slot}
                    onClick={() => setForm({ ...form, slot })}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: slotColor(slot),
                      border: Number(form.slot) === slot ? '3px solid var(--text)' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
              <span className="small muted">
                Seven colours, chosen so they stay tellable apart for colour-blind readers and in both themes.
              </span>
            </div>

            <div className="field">
              <label>Icon</label>
              <div className="row row-wrap">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="icon-btn"
                    aria-label={icon}
                    aria-pressed={form.icon === icon}
                    onClick={() => setForm({ ...form, icon })}
                    style={{ border: form.icon === icon ? '1px solid var(--accent)' : '1px solid var(--line)' }}
                  >
                    <Icon name={icon} />
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="keywords">Words that mean this category</label>
              <input
                id="keywords"
                placeholder="society, membership, dues"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
              <span className="small muted">
                Comma separated. The assistant uses them to suggest this category while you type a description.
              </span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editing === 'new' ? 'Add category' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Layout>
  );
}
