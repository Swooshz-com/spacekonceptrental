import type { Metadata } from "next";
import { StitchContactPage } from "../../components/PublicStitch";

export const metadata: Metadata = { title: "Contact | SpaceKonceptRental", description: "Contact guidance for rental enquiries." };

export default function ContactPage() {
  return <StitchContactPage />;
}
