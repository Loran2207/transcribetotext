import {
  LegalContactCard,
  LegalDocumentView,
  LegalH4,
  LegalLI,
  LegalLink,
  LegalP,
  LegalSectionData,
  LegalTaggedLI,
  LegalTaggedUL,
  LegalUL,
} from "./legal-document-view";

const SECTIONS: LegalSectionData[] = [
  {
    id: "privacy-1",
    num: "01",
    title: "Introduction",
    body: (
      <LegalP>
        Welcome to Transcribetotext.ai (the &quot;Company&quot;, &quot;we&quot;,
        &quot;our&quot;, &quot;us&quot;). We&apos;re committed to protecting
        your privacy and handling your personal information in a safe and
        responsible way. This policy explains how we collect, use, and disclose
        information when you use our online transcription service.
      </LegalP>
    ),
  },
  {
    id: "privacy-2",
    num: "02",
    title: "Information we collect",
    body: (
      <>
        <LegalH4>Personal information</LegalH4>
        <LegalP>
          When you register an account, use our service, or contact us, we may
          collect:
        </LegalP>
        <LegalUL>
          <LegalLI>Name</LegalLI>
          <LegalLI>Email address</LegalLI>
          <LegalLI>Payment information</LegalLI>
          <LegalLI>Account login details</LegalLI>
        </LegalUL>

        <LegalH4>Transcription data</LegalH4>
        <LegalP>
          To provide our service, we collect and process the audio or video
          files you upload, along with any text derived from them
          (&quot;transcription data&quot;).
        </LegalP>

        <LegalH4>Usage data</LegalH4>
        <LegalP>
          We collect information about how you interact with our service — IP
          address, browser type, access times, and referring URLs — so we can
          understand and improve how it&apos;s used.
        </LegalP>
      </>
    ),
  },
  {
    id: "privacy-3",
    num: "03",
    title: "How we use your information",
    body: (
      <LegalUL>
        <LegalLI>To provide, operate, and maintain our service</LegalLI>
        <LegalLI>To improve, personalize, and expand our service</LegalLI>
        <LegalLI>
          To communicate with you, including support and service updates
        </LegalLI>
        <LegalLI>To process transactions and manage your orders</LegalLI>
        <LegalLI>
          To detect and prevent fraudulent or unauthorized activity
        </LegalLI>
        <LegalLI>To comply with legal obligations</LegalLI>
      </LegalUL>
    ),
  },
  {
    id: "privacy-4",
    num: "04",
    title: "How we share your information",
    body: (
      <>
        <LegalP>
          We don&apos;t share your personal information with third parties
          except in the following cases:
        </LegalP>
        <LegalTaggedUL>
          <LegalTaggedLI label="Service providers.">
            We may share information with vendors who perform services on our
            behalf — payment processing, data analysis, email delivery, hosting.
          </LegalTaggedLI>
          <LegalTaggedLI label="Legal requirements.">
            We may disclose information if required by law or in response to
            valid requests by public authorities.
          </LegalTaggedLI>
          <LegalTaggedLI label="Business transfers.">
            In a merger, acquisition, or sale of assets, your information may
            be transferred as part of the transaction.
          </LegalTaggedLI>
        </LegalTaggedUL>
      </>
    ),
  },
  {
    id: "privacy-5",
    num: "05",
    title: "Data security",
    body: (
      <LegalP>
        We use appropriate technical and organizational measures to protect
        your personal information from unauthorized access, use, or disclosure.
        No internet transmission is entirely secure, however, so we can&apos;t
        guarantee absolute security.
      </LegalP>
    ),
  },
  {
    id: "privacy-6",
    num: "06",
    title: "Your rights and choices",
    body: (
      <>
        <LegalP>
          You have certain rights regarding your personal information,
          including:
        </LegalP>
        <LegalUL>
          <LegalLI>Accessing and updating your account information</LegalLI>
          <LegalLI>
            Requesting deletion of your account and personal data
          </LegalLI>
          <LegalLI>Opting out of marketing communications</LegalLI>
          <LegalLI>
            Restricting the processing of your personal information
          </LegalLI>
        </LegalUL>
        <LegalP>
          To exercise any of these rights, contact us at{" "}
          <LegalLink href="mailto:info@transcribetotext.ai">
            info@transcribetotext.ai
          </LegalLink>
          .
        </LegalP>
      </>
    ),
  },
  {
    id: "privacy-7",
    num: "07",
    title: "Children's privacy",
    body: (
      <LegalP>
        Our service is not intended for individuals under 13. We don&apos;t
        knowingly collect personal information from children under 13. If we
        become aware that we have, we&apos;ll take steps to delete it.
      </LegalP>
    ),
  },
  {
    id: "privacy-8",
    num: "08",
    title: "Changes to this policy",
    body: (
      <LegalP>
        We may update this policy from time to time. Any changes will be posted
        on this page with an updated effective date. We encourage you to review
        it periodically.
      </LegalP>
    ),
  },
  {
    id: "privacy-9",
    num: "09",
    title: "Contact us",
    body: (
      <>
        <LegalP>
          If you have questions or concerns about this policy or our data
          practices, get in touch:
        </LegalP>
        <LegalContactCard />
        <p className="mt-[18px] text-[13px] text-muted-foreground">
          Thank you for using Transcribetotext.ai — we&apos;re committed to
          protecting your privacy and keeping your experience secure.
        </p>
      </>
    ),
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentView
      effective="March 16, 2024"
      lastReviewed="April 2026"
      sections={SECTIONS}
    />
  );
}
