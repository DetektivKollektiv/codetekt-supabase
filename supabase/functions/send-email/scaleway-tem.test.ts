import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { sendScalewayEmail } from "./scaleway-tem.ts";

const config = {
  projectId: "project-id",
  secretKey: "secret-key",
  fromEmail: "noreply@notify.codetekt.org",
};

Deno.test("sendScalewayEmail sends the expected TEM request", async () => {
  let url = "";
  let init: RequestInit | undefined;
  const fetcher = ((input: string | URL | Request, options?: RequestInit) => {
    url = String(input);
    init = options;
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as typeof fetch;

  await sendScalewayEmail(
    config,
    {
      to: "recipient@example.com",
      subject: "Test subject",
      html: "<p>Test body</p>",
    },
    fetcher,
  );

  assertEquals(
    url,
    "https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails",
  );
  assertEquals(init?.method, "POST");
  assertEquals(init?.headers, {
    "Content-Type": "application/json",
    "X-Auth-Token": "secret-key",
  });
  assertEquals(JSON.parse(String(init?.body)), {
    from: {
      name: "Codetekt",
      email: "noreply@notify.codetekt.org",
    },
    to: [{ email: "recipient@example.com" }],
    subject: "Test subject",
    html: "<p>Test body</p>",
    project_id: "project-id",
  });
});

Deno.test("sendScalewayEmail reports the TEM status without response data", async () => {
  const fetcher = (() =>
    Promise.resolve(
      new Response('{"message":"sensitive provider response"}', {
        status: 403,
      }),
    )) as typeof fetch;

  await assertRejects(
    () =>
      sendScalewayEmail(
        config,
        {
          to: "recipient@example.com",
          subject: "Test subject",
          html: "<p>Test body</p>",
        },
        fetcher,
      ),
    Error,
    "Scaleway TEM error 403",
  );
});
