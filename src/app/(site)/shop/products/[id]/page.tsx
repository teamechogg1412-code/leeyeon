import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { purchaseProductAction } from "@/lib/actions";
import { formatPrice, getCurrentUserAccess, getStage } from "@/lib/stage";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stage = await getStage();
  const { isOwner } = await getCurrentUserAccess();
  if (!stage.shopEnabled && !isOwner) redirect("/");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  const soldOut = product.stock < 1;

  return (
    <div className="page-shell max-w-4xl">
      <Link href="/shop?tab=md" className="text-sm text-muted hover:text-black">
        ← Shop
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-[#f0eeea]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#ece7e1] to-[#d8cfc4] text-sm text-black/30">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatPrice(product.price)}
          </p>
          {product.description && (
            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-black/75">
              {product.description}
            </p>
          )}
          <p className="mt-4 text-sm text-muted">
            재고 {product.stock.toLocaleString("ko-KR")}개
          </p>

          {soldOut ? (
            <div className="mt-8 inline-block bg-black px-4 py-2 text-sm text-white">
              Sold out
            </div>
          ) : (
            <form
              action={purchaseProductAction.bind(null, product.id)}
              className="mt-8"
            >
              <button
                type="submit"
                className="w-full rounded-full bg-black py-3 text-sm font-medium text-white sm:w-auto sm:px-10"
              >
                구매하기 (데모 결제)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
