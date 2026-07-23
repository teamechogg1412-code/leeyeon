import { redirect } from "next/navigation";

/** Lookbook editorials live on /contents — profile stays internal. */
export default function LookbookRedirectPage() {
  redirect("/contents?category=LOOKBOOK");
}
