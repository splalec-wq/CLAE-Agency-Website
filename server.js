require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Parsers ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Mailer ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'contact@claeagency.com',
    pass: process.env.SMTP_PASSWORD
  }
});

// ── Email HTML builder ───────────────────────────────────
function buildEmailHtml(data) {
  const row = (label, value) => value
    ? `<tr><td style="padding:8px 12px;font-weight:600;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 12px;color:#1a1209;font-size:14px">${value}</td></tr>`
    : '';

  // Contact form
  if (data.em || data.fn) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
      <div style="background:#1a1209;padding:28px 32px">
        <h2 style="margin:0;color:#D4AF37;font-size:20px;letter-spacing:2px;text-transform:uppercase">Nouvelle demande de devis</h2>
        <p style="margin:6px 0 0;color:rgba(240,237,230,.6);font-size:13px">CLAE Agency — Formulaire Contact</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fafaf8">
        ${row('Prénom', data.fn)}
        ${row('Nom', data.ln)}
        ${row('Email', data.em)}
        ${row('Téléphone', data.phone)}
        ${row('Type de projet', data.ptype)}
        ${row('Date événement', data.edate)}
        ${row('Budget', data.budget)}
      </table>
      ${data.msg ? `<div style="padding:20px 24px;background:#fff;border-top:1px solid #eee"><p style="margin:0 0 8px;font-weight:600;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px">Message</p><p style="margin:0;color:#1a1209;font-size:14px;line-height:1.7">${data.msg.replace(/\n/g,'<br>')}</p></div>` : ''}
      <div style="padding:16px 24px;background:#1a1209;text-align:center">
        <p style="margin:0;color:rgba(240,237,230,.4);font-size:11px">CLAE Agency · contact@claeagency.com</p>
      </div>
    </div>`;
  }

  // Reservation form
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
    <div style="background:#1a1209;padding:28px 32px">
      <h2 style="margin:0;color:#D4AF37;font-size:20px;letter-spacing:2px;text-transform:uppercase">Nouvelle réservation</h2>
      <p style="margin:6px 0 0;color:rgba(240,237,230,.6);font-size:13px">CLAE Agency — Formulaire Réservation</p>
    </div>
    <div style="padding:16px 24px;background:#D4AF3722;border-bottom:1px solid #D4AF3744">
      <p style="margin:0;font-size:15px;font-weight:700;color:#1a1209">Formule : ${data.formule || data.formule_choix || '—'}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#fafaf8">
      ${row('Date', data.date_evenement)}
      ${row('Prénom', data.prenom)}
      ${row('Nom', data.nom)}
      ${row('Email', data.email)}
      ${row('Téléphone', data.telephone)}
      ${row('Cérémonie', data.lieu_ceremonie)}
      ${row('Réception', data.lieu_reception)}
      ${row('Nb invités', data.nb_invites)}
      ${row('Heure cérémonie', data.heure_ceremonie)}
      ${row('Style', data.style)}
      ${row('Couleurs', data.couleurs)}
      ${row('Budget', data.budget)}
      ${row('Lieu', data.lieu)}
    </table>
    ${data.inspirations ? `<div style="padding:20px 24px;background:#fff;border-top:1px solid #eee"><p style="margin:0 0 8px;font-weight:600;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px">Inspirations</p><p style="margin:0;color:#1a1209;font-size:14px;line-height:1.7">${data.inspirations.replace(/\n/g,'<br>')}</p></div>` : ''}
    ${data.message ? `<div style="padding:20px 24px;background:#fff;border-top:1px solid #eee"><p style="margin:0 0 8px;font-weight:600;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px">Message</p><p style="margin:0;color:#1a1209;font-size:14px;line-height:1.7">${data.message.replace(/\n/g,'<br>')}</p></div>` : ''}
    <div style="padding:16px 24px;background:#1a1209;text-align:center">
      <p style="margin:0;color:rgba(240,237,230,.4);font-size:11px">CLAE Agency · contact@claeagency.com</p>
    </div>
  </div>`;
}

// ── POST /send ───────────────────────────────────────────
app.post('/send', async (req, res) => {
  const data = req.body;

  // Honeypot anti-bot
  if (data.botcheck) {
    return res.json({ success: false });
  }

  const subject = data.subject || 'Nouvelle demande — CLAE Agency';
  const replyTo = data.em || data.email || undefined;
  const redirectUrl = data.redirect && data.redirect !== 'false' ? data.redirect : null;

  try {
    await transporter.sendMail({
      from: '"CLAE Agency Website" <contact@claeagency.com>',
      to: 'contact@claeagency.com',
      replyTo,
      subject,
      html: buildEmailHtml(data)
    });

    if (redirectUrl) return res.redirect(redirectUrl);
    return res.json({ success: true });

  } catch (err) {
    console.error('Mail error:', err.message);
    if (redirectUrl) return res.redirect('/reservation.html?error=1');
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ── Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-v2.html'));
});

app.listen(PORT, () => {
  console.log(`CLAE Agency running on port ${PORT}`);
});
