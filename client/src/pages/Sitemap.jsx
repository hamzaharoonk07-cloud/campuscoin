import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

// One definition of the site structure, used by both the landing page and the
// signed-in sitemap so the two can never drift apart.
export const SITEMAP = [
  {
    title: 'Getting in',
    links: [
      { to: '/', label: 'Home' },
      { to: '/register', label: 'Create an account' },
      { to: '/login', label: 'Student sign-in' },
      { to: '/forgot-password', label: 'Forgot password' },
      { to: '/admin/login', label: 'Administrator sign-in' },
    ],
  },
  {
    title: 'Everyday',
    links: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/categories', label: 'Manage own categories' },
      { to: '/budgets', label: 'Budgets and alerts' },
    ],
  },
  {
    title: 'Looking back',
    links: [
      { to: '/reports', label: 'Monthly reports' },
      { to: '/insights', label: 'Monthly insights' },
      { to: '/tips', label: 'Saving tips' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { to: '/settings', label: 'Profile and accessibility' },
      { to: '/sitemap', label: 'Sitemap' },
    ],
  },
  {
    title: 'Administrator',
    links: [
      { to: '/admin', label: 'Usage overview' },
      { to: '/admin/students', label: 'Student accounts' },
      { to: '/admin/categories', label: 'Default categories' },
      { to: '/admin/announcements', label: 'Announcements and tip templates' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <Layout title="Sitemap" crumbs={<><Link to="/dashboard">Dashboard</Link> / <span>Sitemap</span></>}>
      <div className="panel">
        <div className="panel-head">
          <h2>Every page in Campus Coin</h2>
          <span className="panel-note">Pages you cannot open are the ones for a different role</span>
        </div>
        <div className="panel-body">
          <div className="sitemap">
            {SITEMAP.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
