import { PolicyLayout, BulletList, SubSection } from "../privacy-policy";

// ── Table helper ───────────────────────────────────────────────────────────

function PolicyTable({ headers, rows }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([col1, col2], i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              <td className="px-4 py-3 text-slate-700 font-medium border-b border-slate-100">{col1}</td>
              <td className="px-4 py-3 text-slate-600 border-b border-slate-100">{col2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────

const sections = [
  {
    id: "overview",
    number: "1",
    title: "Overview",
    content: (
      <div className="space-y-3">
        <p>
          At DilMart, we want every purchase to be safe and reliable. If there is a problem with
          your order, you may be eligible for a return, replacement, or refund in accordance with
          this Policy.
        </p>
        <p>
          As a marketplace, DilMart connects Customers with independent Sellers. We help manage
          the return and refund process to ensure a fair outcome for both parties.
        </p>
      </div>
    ),
  },
  {
    id: "when-can-i-return",
    number: "2",
    title: "When Can I Return a Product?",
    content: (
      <div>
        <p>You may request a return if:</p>
        <BulletList items={[
          "You received the wrong product",
          "The product arrived damaged",
          "The product is defective or does not work properly",
          "The product is missing parts or accessories",
          "The product is significantly different from its description or images",
          "The Seller failed to deliver your order",
          "Your return is permitted under applicable Ethiopian law",
        ]} />
      </div>
    ),
  },
  {
    id: "cannot-return",
    number: "3",
    title: "Products That Cannot Be Returned",
    content: (
      <div>
        <p>Unless required by law, returns are generally not accepted for:</p>
        <BulletList items={[
          "Products damaged after delivery due to misuse or negligence",
          "Customized or personalized products",
          "Perishable goods",
          "Opened health or hygiene products",
          "Products with missing parts, accessories, or packaging caused by the Customer",
          "Products returned in a condition different from when they were received",
        ]} />
      </div>
    ),
  },
  {
    id: "time-limit",
    number: "4",
    title: "Return Request Time Limit and Requirements",
    content: (
      <div>
        <p>
          Customers must submit a return or replacement request within{" "}
          <strong className="text-slate-800">7 days</strong> after receiving the product.
        </p>
        <p className="mt-3">To make the return process easier and faster, Customers should:</p>
        <BulletList items={[
          "Inspect the product immediately after delivery",
          "Report any issues as soon as possible",
          "Keep the product in its original condition where possible",
          "Keep original packaging, accessories, manuals, and included items",
          "Provide clear photos or videos showing the issue",
          "Include order details and a description of the problem",
        ]} />
        <p className="mt-5 font-semibold text-slate-800">Return periods by reason:</p>
        <PolicyTable
          headers={["Reason for Return", "Time Limit"]}
          rows={[
            ["Wrong product received", "Within 7 days after delivery"],
            ["Damaged product", "Within 7 days after delivery"],
            ["Defective product", "Within 7 days after delivery"],
            ["Product not as described", "Within 7 days after delivery"],
            ["Missing parts or accessories", "Within 48 hours after delivery"],
            ["Product not delivered", "After estimated delivery period has passed"],
          ]}
        />
        <p className="mt-5">
          Requests submitted after the applicable return period may not be accepted unless required
          under applicable Ethiopian law, covered by a valid warranty, or approved by DilMart due
          to exceptional circumstances.
        </p>
      </div>
    ),
  },
  {
    id: "process",
    number: "5",
    title: "Return & Replacement Process",
    content: (
      <div>
        <p>Returning a product is simple. Follow these steps:</p>

        <SubSection title="Step 1 — Submit a Return Request">
          <p>Go to <strong className="text-slate-800">My Orders</strong>, select the order, and submit a return request with:</p>
          <BulletList items={[
            "The reason for the return",
            "Photos or videos (mandatory)",
            "A short description of the issue",
          ]} />
        </SubSection>

        <SubSection title="Step 2 — Seller Reviews the Request">
          <p>
            The Seller will review your request and respond within{" "}
            <strong className="text-slate-800">48 hours</strong>. The Seller may approve the
            request, ask for more information, or reject it with a valid reason.
          </p>
          <p className="mt-2">
            If the Seller does not respond in time, DilMart may review the request and take
            appropriate action.
          </p>
        </SubSection>

        <SubSection title="Step 3 — Return the Product">
          <p>
            If approved, return the product with original accessories, packaging, and any free
            items included with the order.
          </p>
        </SubSection>

        <SubSection title="Step 4 — Product Inspection">
          <p>
            After receiving the returned product, the Seller will inspect it to confirm it meets
            return conditions.
          </p>
        </SubSection>

        <SubSection title="Step 5 — Replacement or Refund">
          <p>
            If the return is approved, the Seller will first offer the same product or one of
            equal value. If a replacement is not available, DilMart may approve a refund.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "timeframes",
    number: "6",
    title: "Return & Refund Timeframes",
    content: (
      <div>
        <PolicyTable
          headers={["Activity", "Time"]}
          rows={[
            ["Customer submits a return request", "Within the eligible return period"],
            ["Seller responds to the request", "Within 48 hours"],
            ["Customer returns the product after approval", "Within 7 days"],
            ["Seller inspects the returned product", "Within 2 business days"],
            ["Replacement product is shipped", "Within 3 business days after approval"],
            ["Refund (if applicable)", "Usually within 5–10 business days after approval"],
          ]}
        />
        <p className="mt-4">
          Processing times may vary depending on the payment provider, delivery service, or other
          operational circumstances.
        </p>
      </div>
    ),
  },
  {
    id: "delivery-cost",
    number: "7",
    title: "Who Pays the Return Delivery Cost?",
    content: (
      <PolicyTable
        headers={["Reason for Return", "Return Delivery Cost"]}
        rows={[
          ["Wrong product delivered", "Seller"],
          ["Damaged product", "Seller"],
          ["Defective product", "Seller"],
          ["Product not as described", "Seller"],
          ["Seller failed to deliver", "Seller"],
          ["Customer changes their mind", "Customer"],
        ]}
      />
    ),
  },
  {
    id: "replacement-refund-rules",
    number: "8",
    title: "Replacement and Refund Rules",
    content: (
      <div>
        <p>DilMart aims to resolve eligible returns through replacement whenever possible.</p>
        <p className="mt-3">If your return request is approved:</p>
        <BulletList items={[
          "The Seller should first offer the same product, if available",
          "If unavailable, the Seller may offer another product of equal value, subject to your agreement",
          "If a suitable replacement cannot be provided, a refund may be processed",
        ]} />
        <p className="mt-4">
          Refunds are generally issued using the same payment method used for the original
          purchase, unless another method is agreed upon or required.
        </p>
      </div>
    ),
  },
  {
    id: "change-of-mind",
    number: "9",
    title: "Change-of-Mind Return by Customer",
    content: (
      <div className="space-y-3">
        <p>
          If the Seller delivers the exact product ordered and the Customer later changes their
          mind, selects the wrong product, or returns it for a preference-based reason, the
          Customer may be charged a <strong className="text-slate-800">20% return deduction</strong> from
          the refunded product amount.
        </p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">
            The 20% deduction belongs to the Seller and covers return handling, inspection,
            repackaging, and related costs. It is <em>not</em> a DilMart commission or fee.
          </p>
        </div>
        <p>This deduction <strong className="text-slate-800">does not apply</strong> to returns caused by:</p>
        <BulletList items={[
          "Product defects or damage",
          "Wrong product delivered",
          "Inaccurate product descriptions or images",
          "Other circumstances for which the Seller is responsible",
        ]} />
        <p>
          Where an available replacement of the same value is accepted by the Customer, the 20%
          deduction does not apply.
        </p>
        <p className="text-sm text-slate-500 italic">
          This provision is subject to any mandatory rights provided under applicable Ethiopian law.
        </p>
      </div>
    ),
  },
  {
    id: "disputes",
    number: "10",
    title: "Disputes and Fair Use",
    content: (
      <div>
        <p>
          If you and the Seller cannot reach an agreement, DilMart may review the case and make a
          decision based on the available evidence.
        </p>
        <p className="mt-3">To help resolve disputes quickly, you may be asked to provide:</p>
        <BulletList items={[
          "Photos or videos",
          "Order information",
          "Delivery information",
          "Other relevant evidence",
        ]} />
        <p className="mt-4">DilMart may reject requests involving:</p>
        <BulletList items={[
          "False or misleading information",
          "Returned products that are different from the original item",
          "Intentional product damage",
          "Abuse of the return or refund process",
        ]} />
        <p className="mt-4">
          Repeated misuse of the Platform may result in account restrictions or suspension.
        </p>
      </div>
    ),
  },
  {
    id: "help",
    number: "11",
    title: "Need Help?",
    content: (
      <p>
        If you have questions about your order, return, replacement, or refund, please contact
        DilMart through our official customer support channels. Our support team will assist you
        throughout the process and work with both you and the Seller to resolve issues as fairly
        and quickly as possible.
      </p>
    ),
  },
  {
    id: "changes",
    number: "12",
    title: "Changes to This Policy",
    content: (
      <div className="space-y-3">
        <p>
          DilMart may update this Return & Refund Policy from time to time to reflect changes in
          our services or applicable laws. The latest version will always be available on the
          DilMart Platform.
        </p>
        <p>
          Continued use of the Platform after updates become effective means you accept the
          revised Policy.
        </p>
      </div>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <PolicyLayout
      title="Return & Refund Policy"
      breadcrumb="Return & Refund Policy"
      sections={sections}
      effectiveText="This Return & Refund Policy becomes effective on the date published by DilMart. For questions about this Policy or a return request, please contact DilMart through our official support channels available on the Platform."
    />
  );
}
