import type { Metadata } from "next";
import { StitchAboutPage } from "../../components/PublicStitch";
import { ABOUT_STORY_MEDIA_SLOT } from "../../lib/page-media/public-page-media-content";
import { getPublicPageMedia } from "../../lib/page-media/public-page-media-repository";

export const metadata: Metadata = {
  title: "About | SpaceKonceptRental",
  description:
    "How SpaceKonceptRental supports rental enquiries and event setup planning."
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const storyMedia = await getPublicPageMedia(ABOUT_STORY_MEDIA_SLOT);

  return <StitchAboutPage storyMedia={storyMedia} />;
}
