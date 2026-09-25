// Default colours from earlier versions of the design, now shown as the
// current default (black) so older accounts match the rest of the app.
const LEGACY = ['#047857', '#2f64f0', '#3d5243'];

/**
 * A person's picture: their profile photo when they have uploaded one, and
 * otherwise the first letter of their name on their colour. Used everywhere a
 * person appears, so a new photo shows up in all of those places at once.
 */
export default function Avatar({ user, size = 28, className = '' }) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.46),
    background: user?.avatar ? undefined : LEGACY.includes(user?.avatarColor) ? '#121214' : user?.avatarColor || '#121214',
  };
  return (
    <span className={`avatar ${className}`} style={style} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}
