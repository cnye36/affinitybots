import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Terms of Service
          </h1>

          <div className="prose dark:prose-invert max-w-3xl">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2>1. Terms</h2>
            <p>
              By accessing the website at AgentHub, you are agreeing to be bound
              by these terms of service, all applicable laws and regulations,
              and agree that you are responsible for compliance with any
              applicable local laws. If you do not agree with any of these
              terms, you are prohibited from using or accessing this site.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on
              AgentHub&apos;s website for personal, non-commercial transitory
              viewing only. This is the grant of a license, not a transfer of
              title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>
                Use the materials for any commercial purpose, or for any public
                display (commercial or non-commercial)
              </li>
              <li>
                Attempt to decompile or reverse engineer any software contained
                on AgentHub&apos;s website
              </li>
              <li>
                Remove any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transfer the materials to another person or &ldquo;mirror&rdquo;
                the materials on any other server
              </li>
            </ul>

            <h2>3. Disclaimer</h2>
            <p>
              The materials on AgentHub&apos;s website are provided on an
              &apos;as is&apos; basis. AgentHub makes no warranties, expressed
              or implied, and hereby disclaims and negates all other warranties
              including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>

            <h2>4. Limitations</h2>
            <p>
              In no event shall AgentHub or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on AgentHub&apos;s website, even
              if AgentHub or a AgentHub authorized representative has been
              notified orally or in writing of the possibility of such damage.
            </p>

            <h2>5. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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
