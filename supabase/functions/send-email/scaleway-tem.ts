const SCALEWAY_TEM_EMAILS_URL =
  "https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails";

interface ScalewayTemConfig {
  projectId: string;
  secretKey: string;
  fromEmail: string;
}

interface Email {
  to: string;
  subject: string;
  html: string;
}

export async function sendScalewayEmail(
  config: ScalewayTemConfig,
  email: Email,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(SCALEWAY_TEM_EMAILS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": config.secretKey,
    },
    body: JSON.stringify({
      from: {
        name: "Codetekt",
        email: config.fromEmail,
      },
      to: [{ email: email.to }],
      subject: email.subject,
      html: email.html,
      project_id: config.projectId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scaleway TEM error ${response.status}`);
  }
}
