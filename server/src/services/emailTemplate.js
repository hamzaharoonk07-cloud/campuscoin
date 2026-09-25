import { siteUrl } from '../utils/site.js';

/* ---------------------------------------------------------------------------
   The HTML email every Campus Coin message is wrapped in.

   Email apps ignore most modern CSS, so this is built the old way on
   purpose: a 600px table, every style inline, a PNG banner (Gmail will not
   show SVG), web-safe font fallbacks, and a plain-text version alongside for
   apps that do not show HTML at all. The banner is client/public/email/banner.png,
   served by the site itself.
--------------------------------------------------------------------------- */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const FONT = "'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif";

/**
 * Builds { html, text } for one email.
 *   heading     - the big line under the banner
 *   paragraphs  - body text, one string per paragraph
 *   button      - { label, url } for the one thing to do, or null
 *   stats       - optional [{ label, value }] shown as a row of figures
 *   steps       - optional list of short steps
 *   tip         - optional advice, shown in a blue box
 *   note        - small print under the button (why they got it, expiry...)
 *   preheader   - the grey preview line inboxes show beside the subject
 */
export function emailLayout({ heading, paragraphs = [], button = null, stats = null, steps = null, tip = '', note = '', preheader = '' }) {
  const site = siteUrl();
  const banner = `${site}/email/banner.png`;

  const statsHtml = stats?.length
    ? `<tr><td style="padding:8px 40px 4px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        ${stats
          .map(
            (s) => `<td style="padding:14px;background:#f5f5f6;border-radius:14px;text-align:left;font-family:${FONT}" width="${Math.floor(100 / stats.length)}%">
              <div style="font-size:12px;color:#8e8e98;margin-bottom:4px">${esc(s.label)}</div>
              <div style="font-size:20px;font-weight:700;color:${s.tone === 'bad' ? '#e5484d' : '#121214'}">${esc(s.value)}</div></td>`
          )
          .join('<td width="8"></td>')}
        </tr></table></td></tr>`
    : '';

  const stepsHtml = steps?.length
    ? `<tr><td style="padding:4px 40px 8px">${steps
        .map(
          (st, i) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 10px"><tr>
            <td valign="top" width="28" style="width:28px"><div style="width:28px;height:28px;background:#121214;color:#fff;border-radius:14px;text-align:center;font:700 13px/28px ${FONT}">${i + 1}</div></td>
            <td style="padding-left:12px;font:15px/1.55 ${FONT};color:#3d3d45">${esc(st)}</td></tr></table>`
        )
        .join('')}</td></tr>`
    : '';

  const tipHtml = tip
    ? `<tr><td style="padding:12px 40px 4px"><div style="background:#eaf1ff;border-radius:16px;padding:16px 18px;font:15px/1.6 ${FONT};color:#1e3f96"><strong style="display:block;margin-bottom:4px;color:#121214">One thing to try</strong>${esc(tip)}</div></td></tr>`
    : '';

  const buttonHtml = button
    ? `<tr><td style="padding:12px 40px 8px">
        <a href="${esc(button.url)}" style="display:inline-block;background:#5b91ff;color:#ffffff;text-decoration:none;font:700 16px ${FONT};padding:15px 28px;border-radius:999px">${esc(button.label)} &rarr;</a>
      </td></tr>
      <tr><td style="padding:10px 40px 0;font:12px/1.6 ${FONT};color:#8e8e98">If the button does not work, paste this into your browser:<br><a href="${esc(button.url)}" style="color:#3f74e6;word-break:break-all">${esc(button.url)}</a></td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#ececef">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader || paragraphs[0] || heading)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ececef"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden">
    <tr><td style="background:#121214"><a href="${site}"><img src="${banner}" width="600" alt="Campus Coin - student money, clearly sorted" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a></td></tr>
    <tr><td style="padding:34px 40px 8px;font:700 26px/1.25 ${FONT};color:#121214;letter-spacing:-0.5px">${esc(heading)}</td></tr>
    ${paragraphs.map((p) => `<tr><td style="padding:8px 40px;font:16px/1.65 ${FONT};color:#3d3d45">${esc(p)}</td></tr>`).join('')}
    ${statsHtml}
    ${stepsHtml}
    ${tipHtml}
    ${buttonHtml}
    ${note ? `<tr><td style="padding:22px 40px 0;font:13px/1.6 ${FONT};color:#8e8e98">${esc(note)}</td></tr>` : ''}
    <tr><td style="padding:34px 40px 30px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ebebee"><tr>
      <td style="padding-top:18px;font:12px/1.6 ${FONT};color:#8e8e98">Campus Coin &middot; a budget tracker for students. No bank link, no card details.<br><a href="${site}" style="color:#3f74e6;text-decoration:none">${site.replace(/^https?:\/\//, '')}</a></td>
    </tr></table></td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    heading,
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...(stats?.length ? [stats.map((s) => `${s.label}: ${s.value}`).join(' | '), ''] : []),
    ...(steps?.length ? [...steps.map((st, i) => `${i + 1}. ${st}`), ''] : []),
    ...(tip ? [`One thing to try: ${tip}`, ''] : []),
    ...(button ? [`${button.label}: ${button.url}`, ''] : []),
    ...(note ? [note, ''] : []),
    `- Campus Coin (${site})`,
  ].join('\n');

  return { html, text };
}
