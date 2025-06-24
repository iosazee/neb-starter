import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - NEB Starter",
  description:
    "Privacy Policy for NEB Starter Kit - Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <p className="text-lg text-muted-foreground mb-8">
            <strong>Last updated:</strong> Jun 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to NEB Starter ("we," "our," or "us"). NEB Starter is an open-source starter
              kit and demonstration application that showcases modern web and mobile development
              practices. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you visit our demonstration website at neb-starter.vercel.app
              and use our example mobile application.
            </p>
            <p>
              NEB Starter is provided as an educational and development tool. This demonstration
              application allows developers to test authentication features and explore the
              codebase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Information from Google OAuth</h3>
            <p>
              When you sign in with Google, we collect the following information from your Google
              account:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Basic profile information:</strong> Your name, email address, and profile
                picture
              </li>
              <li>
                <strong>Email address:</strong> Used for account identification and communication
              </li>
              <li>
                <strong>Google user ID:</strong> Used to link your account across sessions
              </li>
            </ul>
            <p>
              We only request the minimum necessary permissions: <code>openid</code>,{" "}
              <code>profile</code>, and <code>email</code> scopes from Google's OAuth API.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.2 Information from GitHub OAuth</h3>
            <p>When you sign in with GitHub, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Public profile information:</strong> Your username, display name, and avatar
              </li>
              <li>
                <strong>Email address:</strong> Your primary email address associated with your
                GitHub account
              </li>
              <li>
                <strong>GitHub user ID:</strong> Used for account identification
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Information from Apple Sign-In</h3>
            <p>When you sign in with Apple (mobile app only), we may collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Name:</strong> If you choose to share it
              </li>
              <li>
                <strong>Email address:</strong> Either your real email or Apple's private relay
                email
              </li>
              <li>
                <strong>Apple user identifier:</strong> A unique identifier for your Apple ID
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.4 Authentication and Session Data</h3>
            <p>To maintain your signed-in state, we store:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Session tokens and authentication credentials</li>
              <li>Account linking information to connect social accounts</li>
              <li>User role information (user or admin)</li>
              <li>Login timestamps and session duration</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.5 Device and Usage Information</h3>
            <p>We automatically collect certain technical information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Device type, browser type, and operating system</li>
              <li>IP address and general geographic location</li>
              <li>Pages visited and features used within the application</li>
              <li>Error logs and performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.6 Biometric Data (Mobile App)</h3>
            <p>
              Our mobile app supports passkey authentication using your device's biometric features
              (Face ID, Touch ID, fingerprint). This biometric data is processed and stored locally
              on your device only - we never have access to your actual biometric information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Authentication:</strong> To verify your identity and maintain your signed-in
                state
              </li>
              <li>
                <strong>Account Management:</strong> To create and manage your user account and
                preferences
              </li>
              <li>
                <strong>Demonstration:</strong> To showcase the features and capabilities of the NEB
                Starter Kit
              </li>
              <li>
                <strong>Security:</strong> To protect against unauthorized access and ensure
                application security
              </li>
              <li>
                <strong>Improvement:</strong> To understand how the demonstration is used and
                identify areas for improvement
              </li>
              <li>
                <strong>Communication:</strong> To send important updates about the service (if
                necessary)
              </li>
              <li>
                <strong>Compliance:</strong> To comply with legal obligations and respond to lawful
                requests
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
            <p>
              We do not sell, trade, or rent your personal information. We may share your
              information only in these limited circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3">4.1 Service Providers</h3>
            <p>
              We share information with trusted third-party services that help us operate the
              demonstration:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Vercel:</strong> Web hosting and deployment platform
              </li>
              <li>
                <strong>Neon:</strong> PostgreSQL database hosting
              </li>
              <li>
                <strong>Google, GitHub, Apple:</strong> Authentication providers
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law or to protect our rights and the
              safety of our users.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.3 Open Source Nature</h3>
            <p>
              While your personal data remains private, please note that NEB Starter is an
              open-source project. The code and configuration (without personal data) are publicly
              available on GitHub.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Encryption:</strong> All data is encrypted in transit using HTTPS/TLS
              </li>
              <li>
                <strong>Database Security:</strong> Data at rest is encrypted in our PostgreSQL
                database
              </li>
              <li>
                <strong>Authentication Security:</strong> We use Better Auth, a security-focused
                authentication library
              </li>
              <li>
                <strong>Access Controls:</strong> Strict access controls limit who can access your
                data
              </li>
              <li>
                <strong>Regular Updates:</strong> We keep all systems and dependencies updated with
                security patches
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>We retain your information for the following periods:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Account Data:</strong> Retained while your account is active
              </li>
              <li>
                <strong>Session Data:</strong> Automatically expires after 7 days of inactivity
              </li>
              <li>
                <strong>Cache Data:</strong> Automatically expires within 5 minutes to 1 hour
              </li>
              <li>
                <strong>Authentication Tokens:</strong> Expire based on provider settings (typically
                1-24 hours)
              </li>
            </ul>
            <p>
              When you delete your account or request data deletion, we will remove your personal
              information within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal information
              </li>
              <li>
                <strong>Correction:</strong> Update inaccurate information through your profile
                settings
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li>
                <strong>Portability:</strong> Request your data in a machine-readable format
              </li>
              <li>
                <strong>Withdrawal:</strong> Disconnect social accounts or revoke OAuth permissions
              </li>
            </ul>
            <p>
              To exercise these rights, you can use the account settings in the application or
              contact us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Google OAuth Compliance</h2>
            <p>
              Our use of information received from Google APIs adheres to the
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>We specifically:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Only request the minimum necessary scopes (openid, profile, email)</li>
              <li>Use Google user data only for providing our authentication service</li>
              <li>
                Do not share Google user data with third parties except as disclosed in this policy
              </li>
              <li>Do not use Google user data for advertising or similar commercial purposes</li>
              <li>Provide users with a way to revoke access to their Google data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Local Storage</h2>
            <p>We use cookies and local storage for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>
                <strong>Authentication:</strong> Maintaining your signed-in state
              </li>
              <li>
                <strong>Preferences:</strong> Remembering your theme and language settings
              </li>
              <li>
                <strong>Security:</strong> Preventing cross-site request forgery (CSRF) attacks
              </li>
              <li>
                <strong>Performance:</strong> Caching data for faster loading times
              </li>
            </ul>
            <p>
              Most cookies are essential for the application to function properly. You can manage
              cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              NEB Starter is not intended for use by children under 13 years of age. We do not
              knowingly collect personal information from children under 13. If we learn that we
              have collected information from a child under 13, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. International Users</h2>
            <p>
              NEB Starter is hosted in the United States. If you are accessing the service from
              outside the United States, please be aware that your information may be transferred
              to, stored, and processed in the United States where our servers are located.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date. Changes become effective immediately upon posting.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p>
                <strong>GitHub:</strong>{" "}
                <a href="https://github.com/iosazee/neb-starter" className="text-primary underline">
                  https://github.com/iosazee/neb-starter
                </a>
              </p>
              <p>
                <strong>Project Website:</strong>{" "}
                <a href="https://neb-starter.vercel.app" className="text-primary underline">
                  https://neb-starter.vercel.app
                </a>
              </p>
            </div>
            <p className="mt-4">We will respond to privacy-related inquiries within 30 days.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Open Source Information</h2>
            <p>
              NEB Starter is an open-source project distributed under the MIT License. While the
              source code is publicly available, this does not affect the privacy of your personal
              data, which remains protected under this Privacy Policy.
            </p>
            <p>
              Developers using NEB Starter to build their own applications are responsible for
              implementing their own privacy policies and ensuring compliance with applicable
              privacy laws.
            </p>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-muted-foreground">
              This privacy policy applies to the NEB Starter demonstration application and is
              effective as of the date listed above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
