import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  { icon: '⚡', title: 'Instant Transfers', text: 'Send and receive money quickly.' },
  { icon: '🔒', title: 'Secure Payments', text: 'Your account and transactions are protected with secure authentication.' },
  { icon: '💳', title: 'Smart Wallet', text: 'Manage your digital balance easily.' },
  { icon: '📊', title: 'Transaction Tracking', text: 'Track all your payments in one place.' },
  { icon: '📱', title: 'Responsive Platform', text: 'Access SPay from desktop, tablet, or mobile.' },
  { icon: '🎯', title: 'Simple Experience', text: 'Easy-to-use interface designed for everyone.' },
];

const steps = [
  { icon: '📝', title: 'Create an Account', text: 'Sign up and securely create your SPay account.' },
  { icon: '💰', title: 'Add Money', text: 'Add demo funds to your SPay wallet.' },
  { icon: '🔄', title: 'Send & Receive', text: 'Make secure and instant payments between users.' },
];

const Home = () => {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Simple. Secure. Instant.</span>
              <h1>Payments Made Simple with SPay</h1>
              <p>
                Send money, receive payments, manage your wallet and track transactions — all from one secure platform.
              </p>
              <div className="hero-actions">
                <a href="/register" className="btn btn-primary">Get Started</a>
                <a href="#features" className="btn btn-secondary">Explore Features</a>
              </div>
              <div className="hero-stats">
                <div>
                  <strong>2.5M+</strong>
                  <span>Payments</span>
                </div>
                <div>
                  <strong>99.9%</strong>
                  <span>Uptime</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Support</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="wallet-card main-card">
                <div className="card-top">
                  <span>Available Balance</span>
                  <span className="chip">SP</span>
                </div>
                <h3>₹25,000</h3>
                <div className="mini-row">
                  <div>
                    <small>Sent</small>
                    <strong>₹10,500</strong>
                  </div>
                  <div>
                    <small>Received</small>
                    <strong>₹18,200</strong>
                  </div>
                </div>
              </div>
              <div className="wallet-card floating-card">
                <span>Last transfer</span>
                <strong>₹1,250</strong>
                <small>Success</small>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Features</span>
              <h2>Everything you need to move money smarter</h2>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section alt-section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">How SPay Works</span>
              <h2>Three simple steps to better payments</h2>
            </div>

            <div className="steps-grid">
              {steps.map((step, index) => (
                <div key={step.title} className="step-card">
                  <div className="step-badge">0{index + 1}</div>
                  <div className="feature-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container about-grid">
            <div>
              <span className="eyebrow">About SPay</span>
              <h2>Built for modern digital payment experiences</h2>
              <p>
                SPay is a digital payment platform designed for secure transactions, instant transfers, and effortless wallet management. Built for educational and portfolio demos, it showcases a polished fintech user journey without connecting to real banking systems.
              </p>
            </div>
            <div className="about-panel">
              <ul>
                <li>Secure wallet experience</li>
                <li>Fast transfers and requests</li>
                <li>Smart transaction insights</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="container contact-box">
            <div>
              <span className="eyebrow">Contact</span>
              <h2>Need help getting started?</h2>
            </div>
            <a href="mailto:hello@spaydemo.com" className="btn btn-primary">hello@spaydemo.com</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
