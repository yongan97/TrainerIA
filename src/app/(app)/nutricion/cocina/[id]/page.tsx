import Link from "next/link";
import { notFound } from "next/navigation";
import { CookMode } from "@/components/kitchen/cook-mode";
import { findCookable, isSauce } from "@/lib/kitchen/week";

export const dynamic = "force-dynamic";

export default async function CocinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = findCookable(id);
  if (!item) notFound();
  const back = isSauce(id) ? "/nutricion/salsas" : "/nutricion";
  return (
    <>
      <CookMode item={item} backHref={back} />
      <p className="sr-only">
        <Link href={back}>Volver</Link>
      </p>
    </>
  );
}
