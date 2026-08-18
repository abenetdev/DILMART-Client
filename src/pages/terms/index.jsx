import { PolicyLayout, BulletList, SubSection } from "../privacy-policy";

const sections = [
  {
    id: "introduction",
    number: "1",
    title: "Introduction",
    content: (
      <div className="space-y-3">
        <p>Welcome to DilMart.</p>
        <p>
          DilMart is an E-commerce company that connects Customers with Sellers, allowing
          Customers to discover, purchase, and receive products from different businesses
          through one platform.
        </p>
        <p>
          These Customer Terms & Conditions explain the rules for using the DilMart Platform,
          placing orders, making payments, and interacting with Sellers.
        </p>
        <p>
          By creating an account, browsing, or using DilMart, you agree to follow these Terms
          & Conditions. Our goal is to create a safe, transparent, and trusted marketplace
          experience for both Customers and Sellers.
        </p>
      </div>
    ),
  },
  {
    id: "about-dilmart",
    number: "2",
    title: "About DilMart",
    content: (
      <div>
        <p>
          DilMart operates as E-commerce platform that connects Customers and Sellers.
          DilMart provides services including:
        </p>
        <BulletList items={[
          "Product discovery",
          "Order processing",
          "Customer and Seller communication",
          "Payment facilitation",
          "Support and dispute assistance",
        ]} />
        <p className="mt-4">
          Unless clearly stated otherwise, DilMart does not manufacture, own, or directly sell
          products listed by Sellers. Sellers are responsible for the products they offer,
          including product quality, descriptions, availability, packaging, and fulfillment
          of orders.
        </p>
        <p className="mt-3">
          DilMart works to maintain a reliable marketplace by monitoring platform activities
          and supporting successful transactions.
        </p>
      </div>
    ),
  },
  {
    id: "account",
    number: "3",
    title: "Customer Account & Responsibilities",
    content: (
      <div>
        <SubSection title="3.1 Creating an Account">
          <p>
            To use certain DilMart services, Customers may need to create an account. When
            creating an account, Customers agree to provide accurate and complete information,
            including:
          </p>
          <BulletList items={["Full name", "Phone number", "Email address", "Delivery information"]} />
          <p className="mt-3">Customers are responsible for keeping their account information updated.</p>
        </SubSection>

        <SubSection title="3.2 Account Security">
          <p>
            Customers are responsible for protecting their account information, including
            passwords and login details. Customers should:
          </p>
          <BulletList items={[
            "Keep login information confidential",
            "Avoid sharing account access with others",
            "Immediately notify DilMart if they suspect unauthorized access",
          ]} />
          <p className="mt-3">
            DilMart is not responsible for losses caused by a Customer's failure to protect
            their account information.
          </p>
        </SubSection>

        <SubSection title="3.3 Honest Use of the Platform">
          <p>Customers agree to use DilMart fairly and legally. Customers must not:</p>
          <BulletList items={[
            "Provide false information",
            "Create accounts for fraudulent purposes",
            "Abuse return, refund, or dispute systems",
            "Attempt to manipulate ratings or reviews",
            "Use DilMart to conduct illegal activities",
            "Attempt to harm the Platform, Sellers, or other Customers",
          ]} />
        </SubSection>

        <SubSection title="3.4 Account Restrictions">
          <p>
            DilMart may restrict, suspend, or terminate accounts where there is reasonable
            evidence of fraudulent activity, abuse of Platform features, violation of these
            Terms, or activities that may harm Customers, Sellers, or DilMart.
          </p>
          <p className="mt-3">
            Where appropriate, DilMart may provide notice before taking action, except where
            immediate action is required for security or legal reasons.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "orders",
    number: "4",
    title: "Browsing Products & Placing Orders",
    content: (
      <div>
        <SubSection title="4.1 Product Information">
          <p>
            Sellers are responsible for ensuring that product information is accurate and up to
            date. DilMart works to improve the accuracy of information displayed on the Platform
            but does not guarantee that every product detail provided by Sellers will always be
            error-free.
          </p>
        </SubSection>

        <SubSection title="4.2 Placing an Order">
          <p>When a Customer places an order through DilMart:</p>
          <BulletList items={[
            "The Customer selects products and provides delivery information",
            "The Customer confirms the order and completes payment where required",
            "The Seller receives the order request",
            "The Seller prepares and fulfills the order",
          ]} />
          <p className="mt-3">
            Submitting an order does not always guarantee acceptance. Orders may be cancelled
            due to product unavailability, incorrect product information, payment issues,
            suspected fraud, or other valid operational reasons.
          </p>
        </SubSection>

        <SubSection title="4.3 Order Confirmation">
          <p>
            An order becomes confirmed when payment is successfully completed and the Seller
            accepts and confirms the order. Customers will receive updates regarding the status
            of their orders through available DilMart communication channels.
          </p>
        </SubSection>

        <SubSection title="4.4 Product Prices and Availability">
          <p>
            Prices and availability of products may change before an order is confirmed. Once
            confirmed, the applicable price will generally be the price shown during checkout,
            unless there is an obvious pricing error or the order cannot be fulfilled due to
            valid circumstances.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "payments",
    number: "5",
    title: "Payments & Transaction Security",
    content: (
      <div>
        <SubSection title="5.1 Payment Methods">
          <p>
            Customers may pay for orders using the payment methods made available on the
            DilMart Platform.
          </p>
        </SubSection>

        <SubSection title="5.2 Payment Confirmation">
          <p>
            Customers are responsible for ensuring that payment information provided during
            checkout is accurate. An order will only be processed after successful payment
            confirmation where payment is required. DilMart may delay, cancel, or review
            orders where payment has failed, payment information appears incorrect, or
            fraudulent activity is suspected.
          </p>
        </SubSection>

        <SubSection title="5.3 Secure Transactions">
          <p>DilMart works with trusted payment service providers to support secure transactions. Customers should:</p>
          <BulletList items={[
            "Use only official DilMart payment methods",
            "Avoid sending payments directly to Sellers outside the Platform",
            "Report suspicious payment requests",
          ]} />
          <p className="mt-3">
            Payments made outside DilMart may not be protected under DilMart's marketplace
            policies.
          </p>
        </SubSection>

        <SubSection title="5.4 Refunds and Payment Adjustments">
          <p>
            If an order qualifies for a refund, the process will follow the DilMart Return &
            Refund Policy. Refund processing times may vary depending on the payment method and
            financial service provider.
          </p>
        </SubSection>

        <SubSection title="5.5 Payment Information Protection">
          <p>
            DilMart does not encourage Customers to share sensitive payment information,
            passwords, or security codes with anyone. Customers should immediately report
            suspicious activity related to their account or payments.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "delivery",
    number: "6",
    title: "Delivery & Order Fulfillment",
    content: (
      <div>
        <SubSection title="6.1 Delivery Process">
          <p>After an order is confirmed:</p>
          <BulletList items={[
            "The Seller prepares the product",
            "The Delivery Partner collects and transports the order where applicable",
            "The Customer receives the product at the provided delivery location",
          ]} />
          <p className="mt-3">
            Delivery times may vary depending on product availability, seller location, customer
            location, delivery partner availability, and other operational circumstances.
          </p>
        </SubSection>

        <SubSection title="6.2 Customer Delivery Information">
          <p>Customers are responsible for providing accurate delivery information, including:</p>
          <BulletList items={[
            "Full delivery address",
            "Correct phone number",
            "Any additional delivery instructions",
          ]} />
          <p className="mt-3">
            Delays or failed deliveries caused by incorrect information or Customer
            unavailability may affect the delivery process.
          </p>
        </SubSection>

        <SubSection title="6.3 Receiving an Order">
          <p>Customers should inspect their order when it is delivered and check:</p>
          <BulletList items={[
            "Whether the received product matches the order",
            "Whether there is visible damage",
            "Whether important accessories or items are included",
          ]} />
          <p className="mt-3">
            If there is an issue, Customers should report it through DilMart support or request
            a return according to the <a href="/refund-policy" className="text-blue-500 font-bold">Return & Refund Policy</a>.
          </p>
        </SubSection>

        <SubSection title="6.4 Delivery Delays">
          <p>
            DilMart and Sellers aim to complete deliveries within the expected timeframe.
            However, delays may occur due to weather conditions, delivery challenges, incorrect
            delivery information, or unexpected operational issues. DilMart will make reasonable
            efforts to assist Customers and resolve delivery-related issues.
          </p>
        </SubSection>

        <SubSection title="6.5 Failed Delivery Attempts">
          <p>
            If delivery cannot be completed due to Customer-related reasons such as an incorrect
            address, unreachable phone number, or Customer unavailability, additional delivery
            arrangements or charges may apply depending on the circumstances.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "seller-relationship",
    number: "7",
    title: "Seller Responsibility & Marketplace Relationship",
    content: (
      <div>
        <SubSection title="7.1 DilMart Marketplace Role">
          <p>
            DilMart operates as a digital marketplace that connects Customers with independent
            Sellers. Unless clearly stated otherwise, DilMart is not the manufacturer, owner,
            or direct seller of products listed by Sellers.
          </p>
        </SubSection>

        <SubSection title="7.2 Seller Responsibilities">
          <p>Sellers are responsible for:</p>
          <BulletList items={[
            "Providing accurate product information",
            "Maintaining product availability",
            "Preparing and packaging orders",
            "Delivering products according to accepted orders",
            "Ensuring products meet applicable quality and safety requirements",
            "Handling valid return or replacement requests according to DilMart policies",
          ]} />
        </SubSection>

        <SubSection title="7.3 Product Information and Quality">
          <p>
            Product descriptions, images, prices, and availability are provided by Sellers.
            If a Customer receives a product that is significantly different from the listed
            information, the Customer may request assistance through DilMart's return and
            dispute process.
          </p>
        </SubSection>

        <SubSection title="7.4 Customer Communication With Sellers">
          <p>
            Customers should keep important transaction communication within the Platform where
            possible to ensure proper records and support.
          </p>
        </SubSection>

        <SubSection title="7.5 DilMart's Commitment">
          <p>DilMart works to maintain a trusted marketplace by:</p>
          <BulletList items={[
            "Verifying Sellers where required",
            "Monitoring marketplace activities",
            "Supporting Customers and Sellers during disputes",
            "Taking action against policy violations",
          ]} />
        </SubSection>
      </div>
    ),
  },
  {
    id: "returns-disputes",
    number: "8",
    title: "Returns, Refunds & Disputes",
    content: (
      <div>
        <SubSection title="8.1 Customer Protection">
          <p>
            DilMart aims to provide a safe and reliable shopping experience. If there is a
            problem with an order, Customers may request a return, replacement, refund, or
            dispute review according to the DilMart <a href="/refund-policy" className="text-blue-500 font-bold">Return & Refund Policy</a>.
          </p>
        </SubSection>

        <SubSection title="8.2 Return and Refund Process">
          <p>Customers may request assistance when:</p>
          <BulletList items={[
            "The wrong product is received",
            "The product is damaged",
            "The product is defective",
            "The product is significantly different from the description",
            "Other eligible issues occur",
          ]} />
        </SubSection>

        <SubSection title="8.3 Dispute Resolution">
          <p>
            If a Customer and Seller cannot resolve an issue, DilMart may review the case and
            assist both parties in reaching a fair resolution, considering order information,
            product details, delivery records, and evidence provided.
          </p>
        </SubSection>

        <SubSection title="8.4 Fair Use of Customer Protection">
          <p>
            Customers agree to use return, refund, and dispute systems honestly. DilMart may
            take action against Customers who submit false claims, abuse refund processes,
            provide misleading information, or attempt to exploit marketplace protections.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "prohibited",
    number: "9",
    title: "Prohibited Activities",
    content: (
      <div>
        <p>Customers must use DilMart responsibly and fairly. Customers must not:</p>

        <SubSection title="9.1 Fraudulent Activities">
          <BulletList items={[
            "Provide false information during account creation or ordering",
            "Use fake identities or multiple accounts for dishonest purposes",
            "Make false claims about orders, deliveries, or products",
            "Attempt to obtain products, refunds, or benefits through deception",
          ]} />
        </SubSection>

        <SubSection title="9.2 Platform Abuse">
          <BulletList items={[
            "Abuse return, refund, or dispute systems",
            "Manipulate ratings, reviews, or feedback",
            "Interfere with the operation or security of the DilMart Platform",
            "Attempt to access another user's account",
          ]} />
        </SubSection>

        <SubSection title="9.3 Off-Platform Transactions">
          <p>
            To maintain transaction protection, Customers should complete purchases through
            DilMart. Transactions completed outside DilMart may not receive marketplace
            protection.
          </p>
        </SubSection>

        <SubSection title="9.4 Harmful or Illegal Activities">
          <BulletList items={[
            "Illegal activities",
            "Selling or purchasing prohibited products",
            "Harassment, threats, or abusive communication",
            "Activities that may harm other Customers, Sellers, or DilMart",
          ]} />
        </SubSection>

        <SubSection title="9.5 Consequences of Violations">
          <p>If DilMart identifies violations of these Terms, we may take appropriate action, including:</p>
          <BulletList items={[
            "Removing content",
            "Cancelling transactions",
            "Restricting account features",
            "Suspending or terminating accounts",
            "Taking further action where required by law",
          ]} />
        </SubSection>
      </div>
    ),
  },
  {
    id: "suspension",
    number: "10",
    title: "Account Suspension & Termination",
    content: (
      <div>
        <SubSection title="10.1 Account Restrictions">
          <p>DilMart may restrict, suspend, or terminate a Customer account when there is reasonable evidence of:</p>
          <BulletList items={[
            "Fraudulent activity",
            "Abuse of Platform features",
            "Repeated violation of these Terms",
            "Attempts to harm Customers, Sellers, or DilMart",
            "Illegal or prohibited activities",
          ]} />
        </SubSection>

        <SubSection title="10.2 Temporary Suspension">
          <p>
            In some situations, DilMart may temporarily restrict account access while reviewing
            security concerns, suspicious transactions, customer complaints, or policy violations.
            During a review, DilMart may request additional information from the Customer.
          </p>
        </SubSection>

        <SubSection title="10.3 Account Termination">
          <p>DilMart may permanently close accounts where serious or repeated violations occur, such as:</p>
          <BulletList items={[
            "Fraudulent transactions",
            "Repeated abuse of return and refund systems",
            "Creating accounts to bypass previous restrictions",
            "Activities that create risk to the marketplace",
          ]} />
        </SubSection>

        <SubSection title="10.4 Customer Account Closure">
          <p>
            Customers may request to close their DilMart account at any time. Before closing,
            Customers should complete or resolve pending orders, return or refund requests,
            outstanding disputes, and other active transactions. Closing an account does not
            remove obligations related to previous transactions.
          </p>
        </SubSection>

        <SubSection title="10.5 Remaining Rights and Records">
          <p>Even after account closure, DilMart may retain certain information where necessary for:</p>
          <BulletList items={[
            "Legal compliance",
            "Fraud prevention",
            "Transaction records",
            "Resolving disputes",
          ]} />
        </SubSection>
      </div>
    ),
  },
  {
    id: "privacy",
    number: "11",
    title: "Privacy & Personal Information",
    content: (
      <div>
        <SubSection title="11.1 Protecting Customer Information">
          <p>DilMart respects Customer privacy and is committed to protecting personal information. We may collect:</p>
          <BulletList items={[
            "Account information",
            "Order details",
            "Delivery information",
            "Payment-related information",
            "Communication records",
          ]} />
        </SubSection>

        <SubSection title="11.2 Use of Customer Information">
          <p>DilMart may use Customer information to:</p>
          <BulletList items={[
            "Create and manage accounts",
            "Process and deliver orders",
            "Connect Customers with Sellers",
            "Provide customer support",
            "Process payments and refunds",
            "Improve Platform security and services",
          ]} />
        </SubSection>

        <SubSection title="11.3 Sharing Information">
          <p>DilMart may share necessary information with trusted parties involved in completing transactions, including Sellers, delivery partners, and payment service providers. DilMart does not sell Customer personal information to third parties.</p>
        </SubSection>

        <SubSection title="11.4 Privacy Policy">
          <p>
            More details about how DilMart collects, uses, stores, and protects personal
            information are available in the DilMart <a href="/refund-policy" className="text-blue-500 font-bold">Privacy Policy</a> . By using DilMart,
            Customers acknowledge that their information will be handled according to
            applicable privacy practices.
          </p>
        </SubSection>
      </div>
    ),
  },
  {
    id: "updates-contact",
    number: "12",
    title: "Policy Updates, Governing Rules & Contact",
    content: (
      <div>
        <SubSection title="12.1 Updates to These Terms">
          <p>
            DilMart may update these Customer Terms & Conditions from time to time to reflect
            improvements to Platform services, changes in marketplace operations, new features,
            or changes in applicable laws or regulations. The updated version will become
            effective when published on the DilMart Platform.
          </p>
        </SubSection>

        <SubSection title="12.2 Applicable Laws">
          <p>
            These Terms & Conditions are governed by and interpreted according to the applicable
            laws of the Federal Democratic Republic of Ethiopia. Nothing in these Terms is
            intended to remove or limit rights that Customers are entitled to under applicable
            Ethiopian laws.
          </p>
        </SubSection>

        <SubSection title="12.3 Electronic Agreement">
          <p>
            By creating an account, placing an order, or using DilMart services, Customers
            acknowledge that they have read, understood, and agreed to these Customer Terms &
            Conditions. Electronic acceptance and transaction records may be maintained by
            DilMart as evidence of agreement and marketplace activity.
          </p>
        </SubSection>

        <SubSection title="12.4 Contact Us">
          <p>
            If you have questions, concerns, or need support regarding these Terms or your
            DilMart experience, please contact DilMart through our official customer support
            channels.
          </p>
        </SubSection>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Customer Terms & Conditions"
      breadcrumb="Terms & Conditions"
      sections={sections}
      effectiveText="These Customer Terms & Conditions are effective from the date published by DilMart. DilMart is committed to creating a trusted digital marketplace where Customers can shop confidently and Sellers can grow their businesses responsibly."
    />
  );
}
