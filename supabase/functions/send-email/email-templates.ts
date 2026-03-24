const baseStyles = `
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #140736;
`;

const logo = `
  <tr>
    <td style="padding: 0 0 22px 0" align="left">
      <img
        src="https://codetekt-frontend.vercel.app/codetekt_logo.png"
        alt="codetekt"
        width="140"
        style="display: block; border: 0"
      />
    </td>
  </tr>
`;

const footer = `
  <tr>
    <td style="padding-top: 32px">
      <p style="margin: 0; font-size: 12px; color: #8c8c9f;">
        Du erhältst diese E-Mail, weil du bei codetekt registriert bist.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 8px">
      <p style="margin: 0; font-size: 12px; color: #8c8c9f;">© codetekt</p>
    </td>
  </tr>
`;

function wrapLayout(content: string): string {
  return `
<div style="${baseStyles}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 36px 16px">
        <table
          role="presentation"
          width="520"
          cellpadding="0"
          cellspacing="0"
          style="width: 520px; max-width: 520px"
        >
          ${logo}
          ${content}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</div>
  `.trim();
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export type EmailTemplate = {
  subject: string;
  html: string;
};

// ─── Template 1: Neuer Fall eingereicht ──────────────────────────────────────

export type NewCaseEmailParams = {
  caseNumber: number;
  caseId: string;
  siteUrl: string;
};

export function newCaseEmail(
  { caseNumber, caseId, siteUrl }: NewCaseEmailParams,
): EmailTemplate {
  const reviewUrl = `${siteUrl}/review/${caseId}`;

  const html = wrapLayout(`
    <!-- Subheadline -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c8c9f;">
          Neuer Fall
        </div>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding: 0 0 14px 0">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;">
          Fall ${caseNumber} eingereicht
        </div>
      </td>
    </tr>

    <!-- Copy -->
    <tr>
      <td style="padding: 0 0 24px 0">
        <p style="margin: 0; font-size: 15px; line-height: 1.65">
          Ein neuer Fall wurde zur Bewertung eingereicht. Deine Einschätzung zählt –
          hilf <strong>codetekt</strong>, diesen Fall zu beurteilen.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="left">
        <a
          href="${reviewUrl}"
          style="display: inline-block; background: #5f38fa; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;"
        >
          Jetzt bewerten
        </a>
      </td>
    </tr>
  `);

  return {
    subject: `Fall ${caseNumber} – Jetzt bewerten`,
    html,
  };
}

// ─── Template 3: Aggregation abgeschlossen (Fall-Ersteller-Benachrichtigung) ──

export type AggregationEmailParams = {
  caseNumber: number;
  caseId: string;
  siteUrl: string;
};

export function aggregationEmail(
  { caseNumber, caseId, siteUrl }: AggregationEmailParams,
): EmailTemplate {
  const archiveUrl = `${siteUrl}/archive/${caseId}`;

  const html = wrapLayout(`
    <!-- Subheadline -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c8c9f;">
          Ergebnis verfügbar
        </div>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding: 0 0 14px 0">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;">
          Fall ${caseNumber} veröffentlicht
        </div>
      </td>
    </tr>

    <!-- Copy -->
    <tr>
      <td style="padding: 0 0 24px 0">
        <p style="margin: 0; font-size: 15px; line-height: 1.65">
          Dein <strong>Fall ${caseNumber}</strong> hat genügend Bewertungen erhalten und ist jetzt
          im Archiv veröffentlicht. Du kannst das Ergebnis der Überprüfung ab sofort einsehen.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="left">
        <a
          href="${archiveUrl}"
          style="display: inline-block; background: #5f38fa; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;"
        >
          Ergebnis ansehen
        </a>
      </td>
    </tr>
  `);

  return {
    subject: `Fall ${caseNumber} – Ergebnis verfügbar`,
    html,
  };
}

// ─── Template 4: Bewertungs-Meilenstein (Fall-Ersteller-Benachrichtigung) ──────

export type ReviewMilestoneEmailParams = {
  caseNumber: number;
  caseId: string;
  reviewCount: number;
  siteUrl: string;
};

export function reviewMilestoneEmail(
  { caseNumber, caseId, reviewCount, siteUrl }: ReviewMilestoneEmailParams,
): EmailTemplate {
  const caseUrl = `${siteUrl}/archive/${caseId}`;

  const html = wrapLayout(`
    <!-- Subheadline -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c8c9f;">
          Bewertungs-Meilenstein
        </div>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding: 0 0 14px 0">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;">
          Dein Fall ${caseNumber} hat ${reviewCount} Bewertungen erhalten
        </div>
      </td>
    </tr>

    <!-- Copy -->
    <tr>
      <td style="padding: 0 0 24px 0">
        <p style="margin: 0; font-size: 15px; line-height: 1.65">
          <strong>Fall ${caseNumber}</strong> hat bisher <strong>${reviewCount} Bewertungen</strong> erhalten.
          Schau dir an, was die Community bisher herausgefunden hat.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="left">
        <a
          href="${caseUrl}"
          style="display: inline-block; background: #5f38fa; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;"
        >
          Fall ansehen
        </a>
      </td>
    </tr>
  `);

  return {
    subject: `Fall ${caseNumber} – ${reviewCount} Bewertungen erhalten`,
    html,
  };
}

// ─── Template 2: Einspruch erhoben (Admin-Benachrichtigung) ──────────────────

export type DisputeField = string; // field_id from review_disputes (e.g. keyword_type, content_type)

export type DisputeEmailParams = {
  caseNumber: number;
  caseId: string;
  disputedField: DisputeField;
};

export function disputeEmail({
  caseNumber,
  caseId,
  disputedField,
}: DisputeEmailParams): EmailTemplate {
  const html = wrapLayout(`
    <!-- Subheadline -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c8c9f;">
          Einspruch erhoben
        </div>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding: 0 0 14px 0">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;">
          Fall ${caseNumber}: Einspruch
        </div>
      </td>
    </tr>

    <!-- Copy -->
    <tr>
      <td style="padding: 0 0 24px 0">
        <p style="margin: 0; font-size: 15px; line-height: 1.65">
          Bei <strong>Fall ${caseNumber}</strong> (ID:
          <code style="font-size: 13px; color: #5f38fa;">${caseId}</code>)
          wurde Einspruch gegen <strong>${disputedField}</strong> erhoben.
        </p>
        <p style="margin: 12px 0 0; font-size: 15px; line-height: 1.65; color: #8c8c9f;">
          Bitte prüfe den Einspruch im Admin-Bereich.
        </p>
      </td>
    </tr>

    <!-- Info box -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="background: #f4f1ff; border-left: 3px solid #5f38fa; border-radius: 6px; padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #140736;">
          <strong>Strittiges Feld:</strong> ${disputedField}<br />
          <strong>Fall-ID:</strong> ${caseId}
        </div>
      </td>
    </tr>
  `);

  return {
    subject: `Einspruch bei Fall ${caseNumber} – ${disputedField}`,
    html,
  };
}

// ─── Template 5: Kommentar gemeldet (Admin-Benachrichtigung) ─────────────────

export type CommentReportEmailParams = {
  caseNumber: number;
  caseId: string;
  commentId: string;
  reportReason: string;
  siteUrl: string;
};

export function commentReportEmail({
  caseNumber,
  caseId,
  commentId,
  reportReason,
  siteUrl,
}: CommentReportEmailParams): EmailTemplate {
  const caseUrl = `${siteUrl}/archive/${caseId}`;

  const html = wrapLayout(`
    <!-- Subheadline -->
    <tr>
      <td style="padding: 0 0 8px 0">
        <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c8c9f;">
          Kommentar gemeldet
        </div>
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td style="padding: 0 0 14px 0">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase;">
          Fall ${caseNumber}: Kommentar-Report
        </div>
      </td>
    </tr>

    <!-- Copy -->
    <tr>
      <td style="padding: 0 0 24px 0">
        <p style="margin: 0; font-size: 15px; line-height: 1.65">
          Für <strong>Fall ${caseNumber}</strong> wurde ein Kommentar gemeldet.
          Bitte prüfe den gemeldeten Inhalt im Admin-Bereich.
        </p>
      </td>
    </tr>

    <!-- Info box -->
    <tr>
      <td style="padding: 0 0 20px 0">
        <div style="background: #f4f1ff; border-left: 3px solid #5f38fa; border-radius: 6px; padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #140736;">
          <strong>Fall-ID:</strong> ${caseId}<br />
          <strong>Kommentar-ID:</strong> ${commentId}<br />
          <strong>Meldegrund:</strong> ${reportReason}
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="left">
        <a
          href="${caseUrl}"
          style="display: inline-block; background: #5f38fa; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;"
        >
          Fall prüfen
        </a>
      </td>
    </tr>
  `);

  return {
    subject: `Kommentar gemeldet – Fall ${caseNumber}`,
    html,
  };
}
