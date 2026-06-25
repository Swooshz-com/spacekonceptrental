import type { Metadata } from "next";
import { StitchAboutPage } from "../../components/PublicStitch";

export const metadata: Metadata = { title: "About | SpaceKonceptRental", description: "How SpaceKonceptRental supports rental enquiries and event setup planning." };

export default function AboutPage() {
  return <StitchAboutPage />;
}
