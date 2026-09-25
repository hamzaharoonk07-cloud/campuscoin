import Icon from './Icon.jsx';
import { passwordChecks, passwordStrength } from '../lib/password.js';

/**
 * A four-step strength meter and the checklist of rules, shown under a
 * new-password field. It updates as the student types, so the form never
 * rejects a password without having said why beforehand.
 */
export default function PasswordStrength({ password, email, name, confirm }) {
  const who = { email, name };
  const { score, label } = passwordStrength(password, who);
  const checks = passwordChecks(password, who);
  if (confirm !== undefined) {
    checks.push({ key: 'match', label: 'Both passwords match', ok: Boolean(password) && password === confirm });
  }

  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-meter" data-score={score} aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <i key={step} className={step <= score ? 'is-on' : ''} />
        ))}
      </div>
      {label ? <span className={`pw-label is-${score}`}>{label}</span> : null}
      <ul className="pw-checks">
        {checks.map((c) => (
          <li key={c.key} className={c.ok ? 'is-ok' : ''}>
            <Icon name={c.ok ? 'check' : 'x'} size={13} strokeWidth={2.4} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
