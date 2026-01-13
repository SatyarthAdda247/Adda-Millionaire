import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCards from "@/components/ProductCards";
import AffiliateJourney from "@/components/AffiliateJourney";
import EarningsCalculator from "@/components/EarningsCalculator";
import Features from "@/components/Features";
import SignupForm from "@/components/SignupForm";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <section id="products">
        <ProductCards />
      </section>
      <section id="journey">
        <AffiliateJourney />
      </section>
      <section id="calculator">
        <EarningsCalculator />
      </section>
      <Features />
      <SignupForm />
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </div>
  );
};

export default Index;
