import { Link } from "react-router-dom";
import { ChevronRight, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

// ── Shared helpers (exported so refund page can reuse them) ────────────────

export function BulletList({ items }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function SubSection({ title, children }) {
  return (
    <div className="mt-5">
      <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export function PolicyLayout({ title, breadcrumb, sections, effectiveText }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const cb = () => setShowScrollTop(window.scrollY > 350);
    window.addEventListener("scroll", cb);
    return () => window.removeEventListener("scroll", cb);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12">

        {/* Breadcrumb */}
        {/* <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{breadcrumb}</span>
        </nav> */}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-10">
          Effective from the date published by DilMart
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s, idx) => (
            <div key={s.id}>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 mb-3">
                {s.number}. {s.title}
              </h2>
              <div className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {s.content}
              </div>
              {idx < sections.length - 1 && (
                <div className="mt-10 border-t border-slate-100" />
              )}
            </div>
          ))}
        </div>

        {/* Effective date */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-sm sm:text-base font-bold text-slate-800 mb-1">Effective Date</p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{effectiveText}</p>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Privacy sections ───────────────────────────────────────────────────────

const sections = [
  {
    id: "introduction",
    number: "1",
    title: "Introduction",
    content: (
      <p>
        At DilMart, we respect your privacy and are committed to protecting your personal
        information. This Privacy Policy explains what information we collect, why we collect it,
        and how we use and protect it when you use the DilMart Platform. By using DilMart, you
        agree to the practices described in this Privacy Policy.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    number: "2",
    title: "Information We Collect",
    content: (
      <div>
        <p>We may collect the following information when you use DilMart:</p>
        <SubSection title="Account Information">
          <BulletList items={["Full name", "Phone number", "Email address", "Account details"]} />
        </SubSection>
        <SubSection title="Order Information">
          <BulletList items={[
            "Products purchased", "Order history", "Delivery address",
            "Order status", "Communication related to your orders",
          ]} />
        </SubSection>
        <SubSection title="Payment Information">
          <p className="mt-1">
            We collect necessary payment transaction information to process payments, refunds, and
            maintain transaction records. DilMart does not store sensitive payment credentials when
            payment processing is handled by authorized payment providers.
          </p>
        </SubSection>
        <SubSection title="Technical Information">
          <p className="mt-1">We may collect limited technical information such as:</p>
          <BulletList items={["Device information", "Browser information", "Platform usage data"]} />
          <p className="mt-3">This helps us improve security and user experience.</p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "how-we-use",
    number: "3",
    title: "How We Use Your Information",
    content: (
      <div>
        <p>DilMart uses your information to:</p>
        <BulletList items={[
          "Create and manage your account",
          "Process and deliver your orders",
          "Connect you with Sellers",
          "Provide customer support",
          "Process payments and refunds",
          "Prevent fraud and maintain marketplace security",
          "Improve our services and user experience",
          "Communicate important updates",
        ]} />
      </div>
    ),
  },
  {
    id: "sharing",
    number: "4",
    title: "Sharing Your Information",
    content: (
      <div>
        <p>
          DilMart may share necessary information with trusted parties to provide marketplace
          services, including:
        </p>
        <SubSection title="Sellers">
          <p className="mt-1">Sellers may receive necessary order information, such as:</p>
          <BulletList items={["Customer name", "Delivery information", "Order details"]} />
          <p className="mt-3">This allows Sellers to prepare and fulfill orders.</p>
        </SubSection>
        <SubSection title="Delivery Partners">
          <p className="mt-1">Delivery providers may receive information required to complete deliveries.</p>
        </SubSection>
        <SubSection title="Payment Providers">
          <p className="mt-1">Payment service providers may process transaction information required to complete payments.</p>
        </SubSection>
        <SubSection title="Legal Requirements">
          <p className="mt-1">DilMart may disclose information where required by applicable Ethiopian laws or legal processes.</p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "data-security",
    number: "5",
    title: "Data Security",
    content: (
      <div>
        <p>DilMart takes reasonable measures to protect personal information from:</p>
        <BulletList items={["Unauthorized access", "Loss", "Misuse", "Disclosure"]} />
        <p className="mt-4">
          However, no online system can guarantee complete security, and users should protect
          their account information.
        </p>
      </div>
    ),
  },
  {
    id: "your-rights",
    number: "6",
    title: "Your Rights",
    content: (
      <div>
        <p>You may have the right to:</p>
        <BulletList items={[
          "Access your personal information",
          "Update incorrect information",
          "Request account deletion where applicable",
          "Ask questions about how your information is used",
        ]} />
        <p className="mt-4">You can contact DilMart support regarding privacy-related requests.</p>
      </div>
    ),
  },
  {
    id: "cookies",
    number: "7",
    title: "Cookies and Similar Technologies",
    content: (
      <div>
        <p>DilMart may use cookies or similar technologies to:</p>
        <BulletList items={[
          "Keep the Platform functioning properly",
          "Remember user preferences",
          "Improve performance",
          "Understand how users interact with our Platform",
        ]} />
        <p className="mt-4">You may manage cookie settings through your browser where available.</p>
      </div>
    ),
  },
  {
    id: "third-party",
    number: "8",
    title: "Third-Party Services",
    content: (
      <div>
        <p>DilMart may use third-party services such as:</p>
        <BulletList items={[
          "Payment providers", "Delivery partners",
          "Analytics providers", "Authentication services",
        ]} />
        <p className="mt-4">
          These services may process information according to their own privacy practices.
        </p>
      </div>
    ),
  },
  {
    id: "changes",
    number: "9",
    title: "Changes to This Privacy Policy",
    content: (
      <div>
        <p>DilMart may update this Privacy Policy when necessary due to:</p>
        <BulletList items={[
          "Legal requirements", "Service improvements", "Changes in Platform operations",
        ]} />
        <p className="mt-4">Updated versions will be published on the DilMart Platform.</p>
      </div>
    ),
  },
  {
    id: "contact",
    number: "10",
    title: "Contact Us",
    content: (
      <p>
        If you have questions or concerns about this Privacy Policy, you can contact DilMart
        through our official support channels.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      breadcrumb="Privacy Policy"
      sections={sections}
      effectiveText="This Privacy Policy is effective from the date published by DilMart. We encourage you to review this page periodically for any updates."
    />
  );
}
