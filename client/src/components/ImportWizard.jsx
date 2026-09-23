import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Modal } from './TransactionForm.jsx';
import { api } from '../lib/api.js';
import { formatDate, money } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

const SAMPLE = `date,type,amount,category,description
2026-09-01,income,20000,Allowance,Monthly allowance
2026-09-02,expense,350,Food,Canteen lunch
2026-09-03,expense,120,,Rickshaw to campus`;

/**
 * CSV import in two deliberate steps. Nothing is written until the student has
 * seen every row, because an import that quietly guesses wrong is much worse
 * than one that asks.
 */
export default function ImportWizard({ categories, onClose, onDone }) {
  const { currency } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(file);
  };

  const analyse = async () => {
    setBusy(true);
    try {
      const data = await api.post('/transactions/import/preview', { csv });
      setPreview(data);
      if (!data.rows.length && data.errors.length) {
        toast.error('Nothing could be read from that file', data.errors[0].message);
      }
    } catch (err) {
      toast.error('Could not read that file', err.message);
    } finally {
      setBusy(false);
    }
  };

  const setRowCategory = (rowNumber, categoryId) => {
    setPreview((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.row === rowNumber ? { ...row, categoryId, via: 'you' } : row)),
    }));
  };

  const commit = async () => {
    setBusy(true);
    try {
      const { imported, skipped } = await api.post('/transactions/import/commit', { rows: preview.rows });
      toast.success(
        `Imported ${imported} transaction${imported === 1 ? '' : 's'}`,
        skipped.length ? `${skipped.length} row${skipped.length === 1 ? '' : 's'} were left out.` : undefined
      );
      onDone();
    } catch (err) {
      toast.error('The import did not finish', err.message);
    } finally {
      setBusy(false);
    }
  };

  const ready = preview?.rows.filter((row) => row.categoryId).length || 0;

  return (
    <Modal title="Import transactions" onClose={onClose}>
      {!preview ? (
        <div className="stack">
          <p className="muted small">
            A CSV with a header row of <code>date, type, amount, category, description</code>. The category column is
            optional - anything left blank gets a suggestion from the assistant, which you can change before anything
            is saved.
          </p>

          <div className="row row-wrap">
            <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" size={15} />
              Choose a file
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCsv(SAMPLE)}>
              Paste an example
            </button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={readFile} hidden />
          </div>

          <div className="field">
            <label htmlFor="csv">Or paste the file here</label>
            <textarea id="csv" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} spellCheck="false" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={!csv.trim() || busy} onClick={analyse}>
              {busy ? <span className="spinner" /> : null}
              Check the file
            </button>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="row row-wrap">
            <span className="pill is-good">{ready} ready</span>
            {preview.rows.length - ready > 0 ? (
              <span className="pill is-warn">{preview.rows.length - ready} need a category</span>
            ) : null}
            {preview.errors.length ? <span className="pill is-bad">{preview.errors.length} unusable</span> : null}
          </div>

          {preview.errors.length ? (
            <div className="form-error">
              {preview.errors.slice(0, 4).map((issue) => (
                <div key={issue.row}>
                  {issue.row ? `Row ${issue.row}: ` : ''}
                  {issue.message}
                </div>
              ))}
            </div>
          ) : null}

          <div className="table-wrap" style={{ maxHeight: '44vh', overflowY: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="right">Amount</th>
                  <th>Description</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row}>
                    <td>{formatDate(row.date)}</td>
                    <td className={`right num${row.type === 'income' ? '' : ''}`}>
                      {row.type === 'income' ? '+' : '−'}
                      {money(row.amount, currency).replace('−', '')}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.description}</td>
                    <td>
                      <select
                        value={row.categoryId || ''}
                        onChange={(e) => setRowCategory(row.row, e.target.value)}
                        style={{ minWidth: 150 }}
                      >
                        <option value="">Skip this row</option>
                        {categories
                          .filter((c) => c.type === row.type)
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      {row.via === 'assistant' && row.categoryId ? (
                        <div className="small muted">suggested, {Math.round(row.confidence * 100)}% sure</div>
                      ) : null}
                      {row.via === 'file' ? <div className="small muted">from the file</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setPreview(null)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={commit}>
              {busy ? <span className="spinner" /> : null}
              Import {ready} transaction{ready === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
