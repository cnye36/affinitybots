import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-3xl">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to AgentHub. We respect your privacy and are committed to
              protecting your personal data. This privacy policy will inform you
              about how we look after your personal data when you visit our
              website and tell you about your privacy rights and how the law
              protects you.
            </p>

            <h2>2. The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of
              personal data about you including:
            </p>
            <ul>
              <li>
                Identity Data: includes name, username or similar identifier
              </li>
              <li>Contact Data: includes email address</li>
              <li>
                Technical Data: includes internet protocol (IP) address, browser
                type and version, time zone setting and location, browser
                plug-in types and versions, operating system and platform
              </li>
              <li>
                Usage Data: includes information about how you use our website
                and services
              </li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to.
              Most commonly, we will use your personal data in the following
              circumstances:
            </p>
            <ul>
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>
                To gather analysis or valuable information so that we can
                improve our service
              </li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your
              personal data from being accidentally lost, used or accessed in an
              unauthorized way, altered or disclosed. In addition, we limit
              access to your personal data to those employees, agents,
              contractors and other third parties who have a business need to
              know.
            </p>

            <h2>5. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p>
              <a href="mailto:support@agenthub.click">support@agenthub.click</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
