import { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Icon from '../../components/Icon.jsx';
import { Modal } from '../../components/TransactionForm.jsx';
import { api } from '../../lib/api.js';
import { slotColor } from '../../lib/format.js';
import { useToast } from '../../context/AppContext.jsx';

const ICONS = ['tag', 'utensils', 'bus', 'home', 'book', 'repeat', 'film', 'wallet', 'briefcase', 'award', 'gift', 'plus-circle'];
const SLOTS = [1, 2, 3, 4, 5, 6, 7];
const BLANK = { name: '', type: 'expense', icon: 'tag', slot: 1, keywords: '' };

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(() => {
    api
      .get('/admin/categories')
      .then(({ categories: list }) => setCategories(list))
      .catch((err) => toast.error('Could not load the categories', err.message));
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
      keywords: form.keywords.split(',').map((w) => w.trim()).filter(Boolean),
    };
    // The archive switch lives on the row being edited, not on the form fields.
    if (editing !== 'new') payload.archived = Boolean(editing.archived);
    try {
      if (editing === 'new') await api.post('/admin/categories', payload);
      else await api.patch(`/admin/categories/${editing._id}`, payload);
      toast.success(`${payload.name} saved`);
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save it', err.message);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Remove "${category.name}" from every student's list?`)) return;
    try {
      const { message } = await api.del(`/admin/categories/${category._id}`);
      toast.success(message);
      load();
    } catch (err) {
      toast.error('Could not remove it', err.message);
    }
  };

  const groups = [
    { key: 'expense', title: 'Expense categories' },
    { key: 'income', title: 'Income categories' },
  ];

  return (
    <Layout
      title="Default categories"
      actions={
        <button type="button" className="btn btn-primary" onClick={() => open(null)}>
          <Icon name="plus" />
          New default
        </button>
      }
    >
      <p className="muted">
        These appear in every student&rsquo;s list. Students can add their own on top, but cannot edit or delete
        these.
      </p>

      {groups.map((group) => (
        <section className="panel" key={group.key}>
          <div className="panel-head">
            <h2>{group.title}</h2>
          </div>
          <div className="panel-body">
            <div className="spine">
              {categories
                .filter((c) => c.type === group.key)
                .map((category) => (
                  <div className="spine-row" key={category._id} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                    <div className="spine-name">
                      <span className="ledger-dot" style={{ background: slotColor(category.slot), width: 26, height: 26 }}>
                        <Icon name={category.icon} size={13} />
                      </span>
                      <span>{category.name}</span>
                      {category.archived ? <span className="pill is-warn">archived</span> : null}
                    </div>
                    <div className="row">
                      <span className="small muted nowrap">{category.transactionCount} uses</span>
                      <button type="button" className="icon-btn" onClick={() => open(category)} aria-label={`Edit ${category.name}`}>
                        <Icon name="edit" size={15} />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => remove(category)} aria-label={`Remove ${category.name}`}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      ))}

      {editing ? (
        <Modal title={editing === 'new' ? 'New default category' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form className="stack" onSubmit={save}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {editing === 'new' ? (
              <div className="seg" role="group" aria-label="Type">
                <button type="button" aria-pressed={form.type === 'expense'} onClick={() => setForm({ ...form, type: 'expense' })}>
                  Expense
                </button>
                <button type="button" aria-pressed={form.type === 'income'} onClick={() => setForm({ ...form, type: 'income' })}>
                  Income
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
              <label htmlFor="keywords">Keywords for the assistant</label>
              <input
                id="keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="canteen, cafe, lunch"
              />
              <span className="small muted">
                These give new accounts a sensible first guess, before the assistant has learned anything about that
                student.
              </span>
            </div>

            {editing !== 'new' ? (
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(editing.archived)}
                  onChange={(e) => setEditing({ ...editing, archived: e.target.checked })}
                />
                Hide from new transactions (archived)
              </label>
            ) : null}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Layout>
  );
}
