import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SecondHeroSection from "@/components/SecondHeroSection";
import ContentSection from "@/components/ContentSection";
import ServicesSection from "@/components/ServicesSection";
import DemospaceSection from "@/components/DemospaceSection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <SecondHeroSection />
        <ContentSection />
        <ServicesSection />
        <DemospaceSection />
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
