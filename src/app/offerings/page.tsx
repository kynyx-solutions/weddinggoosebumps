import Navigation from "@/components/sections/navigation";
import OfferingsClient from "./OfferingsClient";
import FaqSection from "@/components/sections/faq-section";
import Footer from "@/components/sections/footer";

export default function OfferingsPage() {
  return (
    <>
      <Navigation />
      <OfferingsClient beforeFooter={<FaqSection page="Offerings" />} footer={<Footer />} />
    </>
  );
}
