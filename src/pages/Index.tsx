import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import ProductCards from "@/components/ProductCards";
import AffiliateJourney from "@/components/AffiliateJourney";
import HowYouEarn from "@/components/HowYouEarn";
import Features from "@/components/Features";
import Comparison from "@/components/Comparison";
import SignupForm from "@/components/SignupForm";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Comparison />
      <section id="calculator">
        <HowYouEarn />
      </section>
      <section id="products">
        <ProductCards />
      </section>
      <section id="journey">
        <AffiliateJourney />
      </section>
      <SignupForm />
      <section id="faq">
        <FAQ />
      </section>
      <Footer />
    </div>
  );
};

export default Index;
