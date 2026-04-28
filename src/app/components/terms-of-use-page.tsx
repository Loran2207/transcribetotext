import {
  LegalContactCard,
  LegalDocumentView,
  LegalH4,
  LegalLI,
  LegalP,
  LegalSectionData,
  LegalUL,
} from "./legal-document-view";

const SECTIONS: LegalSectionData[] = [
  {
    id: "tos-1",
    num: "01",
    title: "Acceptance of terms",
    body: (
      <LegalP>
        By accessing or using the online transcription service
        (&quot;service&quot;) provided by Transcribetotext.ai (the
        &quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;),
        you agree to be bound by these Terms of Use (&quot;terms&quot;). If you
        don&apos;t agree to these terms, don&apos;t use our service.
      </LegalP>
    ),
  },
  {
    id: "tos-2",
    num: "02",
    title: "Description of service",
    body: (
      <LegalP>
        Our service lets you upload audio or video files for transcription.
        Transcripts can be downloaded or accessed through our platform.
        Specific features and functionality may evolve over time.
      </LegalP>
    ),
  },
  {
    id: "tos-3",
    num: "03",
    title: "User accounts",
    body: (
      <>
        <LegalH4>Registration</LegalH4>
        <LegalP>
          To use our service, you must create an account with accurate and
          complete information. You&apos;re responsible for keeping your
          credentials confidential and for all activity under your account.
        </LegalP>

        <LegalH4>Eligibility</LegalH4>
        <LegalP>
          You must be at least 18 years old to use our service. By registering,
          you confirm that you meet this requirement.
        </LegalP>
      </>
    ),
  },
  {
    id: "tos-4",
    num: "04",
    title: "Use of the service",
    body: (
      <>
        <LegalH4>License</LegalH4>
        <LegalP>
          We grant you a limited, non-exclusive, non-transferable, revocable
          license to use the service in accordance with these terms.
        </LegalP>

        <LegalH4>Prohibited conduct</LegalH4>
        <LegalP>You agree not to:</LegalP>
        <LegalUL>
          <LegalLI>Violate any applicable laws or regulations</LegalLI>
          <LegalLI>
            Upload content that infringes on the rights of others, including
            intellectual property
          </LegalLI>
          <LegalLI>
            Use the service to distribute spam or unsolicited messages
          </LegalLI>
          <LegalLI>Interfere with or disrupt the service or its servers</LegalLI>
          <LegalLI>
            Attempt to gain unauthorized access to the service or related
            systems
          </LegalLI>
        </LegalUL>

        <LegalH4>Changes to subscription terms</LegalH4>
        <LegalP>
          We may modify subscription fees, billing cycles, or features at any
          time. Changes take effect at the start of the next billing period.
          Continued use after such changes means you accept the updated terms.
        </LegalP>
      </>
    ),
  },
  {
    id: "tos-5",
    num: "05",
    title: "Transcription data",
    body: (
      <LegalP>
        By uploading files, you grant us the right to process and transcribe
        their contents. You retain all rights to your transcription data and we
        claim no ownership of it. You&apos;re solely responsible for the
        content you upload and for ensuring it complies with these terms and
        applicable law.
      </LegalP>
    ),
  },
  {
    id: "tos-6",
    num: "06",
    title: "Payment and fees",
    body: (
      <>
        <LegalH4>Fees</LegalH4>
        <LegalP>
          Some features require payment. You agree to pay all applicable fees
          as described on our website. Fees are non-refundable unless stated
          otherwise.
        </LegalP>

        <LegalH4>Billing</LegalH4>
        <LegalP>
          We use third-party payment processors to handle transactions. By
          making a purchase, you agree to provide accurate payment information
          and authorize us to charge your payment method.
        </LegalP>

        <LegalH4>Taxes</LegalH4>
        <LegalP>
          Subscription fees don&apos;t include applicable taxes, levies, or
          duties. You&apos;re responsible for paying any such amounts.
        </LegalP>

        <LegalH4>Failed payments</LegalH4>
        <LegalP>
          If a payment attempt fails, we may retry the charge. If we still
          can&apos;t process payment, we reserve the right to suspend or
          terminate access to paid features.
        </LegalP>

        <LegalH4>Subscription &amp; renewal</LegalH4>
        <LegalP>
          Some features are available on a subscription basis. By purchasing a
          subscription, you authorize us to charge the applicable fee
          (including taxes) to your selected payment method.
        </LegalP>
        <LegalP>
          Subscriptions renew automatically at the end of each billing period
          unless cancelled at least <strong className="font-semibold text-foreground">24 hours</strong> before the end of the current period.
          Deleting your account or stopping use of the service does not
          automatically cancel your subscription.
        </LegalP>
      </>
    ),
  },
  {
    id: "tos-7",
    num: "07",
    title: "Intellectual property",
    body: (
      <>
        <LegalH4>Ownership</LegalH4>
        <LegalP>
          All content and materials on our service — text, graphics, logos,
          software — are the property of the Company or its licensors and are
          protected by intellectual property laws.
        </LegalP>

        <LegalH4>Trademarks</LegalH4>
        <LegalP>
          Transcribetotext.ai and its logos are trademarks of the Company. You
          may not use them without our prior written permission.
        </LegalP>
      </>
    ),
  },
  {
    id: "tos-8",
    num: "08",
    title: "Termination",
    body: (
      <LegalP>
        We may suspend or terminate your access to the service, including paid
        subscriptions, if you violate these terms or fail to make required
        payments. Termination doesn&apos;t relieve you of any payment
        obligations incurred prior to termination.
      </LegalP>
    ),
  },
  {
    id: "tos-9",
    num: "09",
    title: "Disclaimers & limitation of liability",
    body: (
      <>
        <LegalH4>Disclaimers</LegalH4>
        <LegalP>
          Our service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, express or implied. We don&apos;t
          warrant that the service will be uninterrupted, error-free, or
          secure.
        </LegalP>

        <LegalH4>Limitation of liability</LegalH4>
        <LegalP>
          To the maximum extent permitted by law, we&apos;re not liable for any
          indirect, incidental, special, consequential, or punitive damages —
          including loss of profits, revenue, data, use, or goodwill — arising
          from your use of (or inability to use) the service, unauthorized
          access to our systems, interruptions, bugs, errors in content, or the
          conduct of any third party.
        </LegalP>
      </>
    ),
  },
  {
    id: "tos-10",
    num: "10",
    title: "Indemnification",
    body: (
      <LegalP>
        You agree to indemnify and hold harmless the Company, its affiliates,
        and their officers, directors, employees, agents and contractors from
        any claims, damages, losses, liabilities, costs and expenses (including
        reasonable attorney&apos;s fees) arising from your use of the service,
        your violation of these terms, your violation of others&apos; rights,
        or your conduct in connection with the service.
      </LegalP>
    ),
  },
  {
    id: "tos-11",
    num: "11",
    title: "Governing law",
    body: (
      <LegalP>
        These terms are governed by the laws of{" "}
        <strong className="font-semibold text-foreground">Estonia</strong>,
        without regard to its conflict-of-law principles.
      </LegalP>
    ),
  },
  {
    id: "tos-12",
    num: "12",
    title: "Changes to the terms",
    body: (
      <LegalP>
        We may modify these terms from time to time. Changes will be posted on
        this page with an updated effective date. Continued use of the service
        after such changes means you accept the new terms.
      </LegalP>
    ),
  },
  {
    id: "tos-13",
    num: "13",
    title: "Contact us",
    body: (
      <>
        <LegalP>If you have questions about these terms, get in touch:</LegalP>
        <LegalContactCard />
        <p className="mt-[18px] text-[13px] text-muted-foreground">
          Thank you for choosing Transcribetotext.ai for your transcription
          needs.
        </p>
      </>
    ),
  },
];

export function TermsOfUsePage() {
  return (
    <LegalDocumentView
      effective="March 16, 2024"
      lastReviewed="April 2026"
      sections={SECTIONS}
    />
  );
}
