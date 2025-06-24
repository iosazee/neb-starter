import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - NEB Starter",
  description:
    "Terms of Service for NEB Starter Kit - Learn about the terms and conditions for using our demonstration application.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <p className="text-lg text-muted-foreground mb-8">
            <strong>Last updated:</strong> June 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to NEB Starter ("we," "our," or "us"). These Terms of Service ("Terms") govern
              your use of the NEB Starter demonstration application, including our website at
              neb-starter.vercel.app and our mobile application (collectively, the "Service").
            </p>
            <p>
              NEB Starter is an open-source starter kit and educational demonstration that showcases
              modern web and mobile development practices using Next.js, Expo, and Better Auth. By
              accessing or using our Service, you agree to be bound by these Terms.
            </p>
            <p>
              <strong>
                If you disagree with any part of these terms, then you may not access the Service.
              </strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Nature of the Service</h2>

            <h3 className="text-xl font-semibold mb-3">
              2.1 Educational and Demonstration Purpose
            </h3>
            <p>
              NEB Starter is provided primarily for educational, demonstration, and development
              purposes. It serves as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>A showcase of modern web and mobile development practices</li>
              <li>A starting point for developers building similar applications</li>
              <li>
                A demonstration of authentication, database integration, and cross-platform
                development
              </li>
              <li>
                An educational resource for learning React, Next.js, Expo, and related technologies
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Open Source Project</h3>
            <p>
              NEB Starter is distributed as open-source software under the MIT License. The source
              code is publicly available on GitHub at
              <a
                href="https://github.com/iosazee/neb-starter"
                className="text-primary underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/iosazee/neb-starter
              </a>
              . You are free to use, modify, and distribute the code according to the terms of the
              MIT License.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.3 No Commercial Guarantee</h3>
            <p>
              While we strive to maintain the Service's availability and functionality, NEB Starter
              is provided as a demonstration and educational tool without commercial guarantees or
              service level agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
            <p>You may create an account using supported authentication methods:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Google OAuth</li>
              <li>GitHub OAuth</li>
              <li>Apple Sign-In (mobile app only)</li>
              <li>Passkey authentication (mobile app)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Account Responsibility</h3>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Promptly notifying us of any unauthorized use of your account</li>
              <li>Providing accurate and current information during registration</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Account Termination</h3>
            <p>
              You may delete your account at any time through the application settings. We reserve
              the right to suspend or terminate accounts that violate these Terms or for maintenance
              purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>

            <h3 className="text-xl font-semibold mb-3">4.1 Permitted Uses</h3>
            <p>You may use the Service to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Explore and test the demonstration features</li>
              <li>Learn about modern web and mobile development practices</li>
              <li>Evaluate the starter kit for your own projects</li>
              <li>Provide feedback and contribute to the open-source project</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Prohibited Uses</h3>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit malicious code, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>
                Reverse engineer, decompile, or disassemble the Service (except as permitted by law)
              </li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Impersonate others or create false accounts</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Use the Service for commercial purposes without explicit permission</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Rate Limiting</h3>
            <p>
              We may impose rate limits on API usage and user actions to ensure fair access and
              maintain Service performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold mb-3">5.1 Open Source License</h3>
            <p>
              NEB Starter is licensed under the MIT License. This means you are free to use, copy,
              modify, merge, publish, distribute, sublicense, and/or sell copies of the software,
              subject to the terms of the MIT License.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.2 Third-Party Components</h3>
            <p>
              The Service incorporates various open-source libraries and components, each governed
              by their respective licenses. These include but are not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Next.js (MIT License)</li>
              <li>React (MIT License)</li>
              <li>Expo SDK (MIT License)</li>
              <li>Better Auth (MIT License)</li>
              <li>Prisma (Apache 2.0 License)</li>
              <li>Tailwind CSS (MIT License)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.3 User Content</h3>
            <p>
              You retain ownership of any content you submit to the Service. By submitting content,
              you grant us a non-exclusive, worldwide, royalty-free license to use, display, and
              distribute your content in connection with the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.4 Trademarks</h3>
            <p>
              "NEB Starter" and related logos are trademarks. Third-party trademarks mentioned in
              the Service are the property of their respective owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Service Availability and Modifications
            </h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Service Availability</h3>
            <p>
              We strive to maintain the Service's availability but do not guarantee uninterrupted
              access. The Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Scheduled maintenance and updates</li>
              <li>Technical difficulties or server issues</li>
              <li>Third-party service dependencies</li>
              <li>Force majeure events</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">6.2 Service Modifications</h3>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any
              time. As an open-source project, significant changes will typically be announced
              through our GitHub repository.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.3 Third-Party Dependencies</h3>
            <p>
              The Service relies on third-party services including but not limited to hosting
              providers (Vercel), database services (Neon), and authentication providers (Google,
              GitHub, Apple). We are not responsible for the availability or performance of these
              third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection, use, and protection of your personal
              information is governed by our
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              , which is incorporated into these Terms by reference.
            </p>
            <p>Key points include:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                We collect minimal necessary information for authentication and service operation
              </li>
              <li>
                We do not sell or share your personal data with third parties for commercial
                purposes
              </li>
              <li>You have rights to access, correct, and delete your personal information</li>
              <li>We implement appropriate security measures to protect your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Disclaimers and Limitation of Liability
            </h2>

            <h3 className="text-xl font-semibold mb-3">8.1 "As Is" Service</h3>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE EXPRESSLY DISCLAIM
              ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT
              LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.2 Educational Purpose Disclaimer</h3>
            <p>
              NEB Starter is provided primarily for educational and demonstration purposes. While we
              implement security best practices, this demonstration application should not be used
              as-is for production applications without proper security review and modifications.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.3 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, WHETHER ARISING FROM CONTRACT,
              TORT, OR OTHERWISE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.4 Maximum Liability</h3>
            <p>
              Our total liability to you for all claims arising from or relating to the Service
              shall not exceed $100 USD or the amount you paid to use the Service (if any) in the 12
              months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold us harmless from and against any and all
              claims, damages, obligations, losses, liabilities, costs, and expenses (including
              attorney's fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit to the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Governing Law and Dispute Resolution
            </h2>

            <h3 className="text-xl font-semibold mb-3">10.1 Governing Law</h3>
            <p>
              These Terms shall be interpreted and governed by the laws of the United States and the
              State of California, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold mb-3">10.2 Dispute Resolution</h3>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved
              through binding arbitration in accordance with the rules of the American Arbitration
              Association, except that either party may seek injunctive relief in court to protect
              intellectual property rights.
            </p>

            <h3 className="text-xl font-semibold mb-3">10.3 Class Action Waiver</h3>
            <p>
              You agree that any arbitration or legal proceeding shall be limited to the dispute
              between you and us individually. You waive any right to participate in class action
              lawsuits or class-wide arbitrations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>

            <h3 className="text-xl font-semibold mb-3">11.1 Termination by You</h3>
            <p>
              You may stop using the Service at any time and delete your account through the
              application settings.
            </p>

            <h3 className="text-xl font-semibold mb-3">11.2 Termination by Us</h3>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              notice, for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>Technical or security reasons</li>
              <li>Discontinuation of the Service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">11.3 Effect of Termination</h3>
            <p>
              Upon termination, your right to use the Service will cease immediately. We may delete
              your account and associated data according to our data retention policies outlined in
              our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of
              material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Providing notice through the Service or via email (if applicable)</li>
              <li>Announcing changes in our GitHub repository</li>
            </ul>
            <p>
              Your continued use of the Service after any changes constitutes acceptance of the new
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Miscellaneous</h2>

            <h3 className="text-xl font-semibold mb-3">13.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between
              you and us regarding the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3">13.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions
              will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold mb-3">13.3 Waiver</h3>
            <p>
              No waiver of any term or condition shall be deemed a further or continuing waiver of
              such term or any other term.
            </p>

            <h3 className="text-xl font-semibold mb-3">13.4 Assignment</h3>
            <p>
              We may assign our rights and obligations under these Terms without restriction. You
              may not assign your rights under these Terms without our prior written consent.
            </p>

            <h3 className="text-xl font-semibold mb-3">13.5 Force Majeure</h3>
            <p>
              We shall not be liable for any failure or delay in performance due to circumstances
              beyond our reasonable control, including but not limited to acts of God, war,
              terrorism, or internet service provider failures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p>
                <strong>GitHub Issues:</strong>{" "}
                <a
                  href="https://github.com/iosazee/neb-starter/issues"
                  className="text-primary underline"
                >
                  https://github.com/iosazee/neb-starter/issues
                </a>
              </p>
              <p>
                <strong>Project Website:</strong>{" "}
                <a href="https://neb-starter.vercel.app" className="text-primary underline">
                  https://neb-starter.vercel.app
                </a>
              </p>
            </div>
            <p className="mt-4">
              For technical questions or contributions, please use our GitHub repository. For legal
              or privacy matters, please use the email address above.
            </p>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-muted-foreground">
              These terms of service apply to the NEB Starter demonstration application and are
              effective as of the date listed above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
