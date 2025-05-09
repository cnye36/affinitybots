import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Cookie Policy</h1>

          <div className="prose dark:prose-invert max-w-3xl">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small pieces of text sent by your web browser by a
              website you visit. A cookie file is stored in your web browser and
              allows the service or a third-party to recognize you and make your
              next visit easier and the service more useful to you.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul>
              <li>To enable certain functions of the service</li>
              <li>To provide analytics</li>
              <li>To store your preferences</li>
              <li>To enable ad delivery and behavioral targeting</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            <p>
              Essential cookies: These cookies are essential to provide you with
              services available through our website and to enable you to use
              certain features of our website. Without these cookies, we cannot
              provide you certain services on our website.
            </p>
            <p>
              Functionality cookies: These cookies are used to provide you with
              a more personalized experience on our website and to remember
              choices you make when you use our website.
            </p>
            <p>
              Analytics cookies: These cookies track information about how our
              website is being used so that we can make improvements and report
              on our performance. We might also use analytics cookies to test
              new ads, pages, or features to see how users react to them.
            </p>

            <h2>4. Your Choices Regarding Cookies</h2>
            <p>
              If you&apos;d like to delete cookies or instruct your web browser
              to delete or refuse cookies, please visit the help pages of your
              web browser. Please note, however, that if you delete cookies or
              refuse to accept them, you might not be able to use all of the
              features we offer, you may not be able to store your preferences,
              and some of our pages might not display properly.
            </p>

            <h2>5. Contact</h2>
            <p>
              If you have any questions about our Cookie Policy, please contact
              us at:
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
