"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { formatInches, getMeasurement } from "@/lib/blanks";
import { CHECKOUT_NOTE, FIT_COPY } from "@/lib/copy";
import { formatPrice, type ProductImage, type StorefrontProduct } from "@/lib/product";
import { PrintProfile } from "./PrintProfile";

const POSITION_ORDER = ["front", "back", "left_sleeve", "right_sleeve", "other"];

function sortImages(images: ProductImage[]): ProductImage[] {
  const rank = (p: string) => {
    const i = POSITION_ORDER.indexOf(p);
    return i === -1 ? POSITION_ORDER.length : i;
  };
  return [...images].sort((a, b) => rank(a.position) - rank(b.position));
}

export function ProductConfigurator({ product }: { product: StorefrontProduct }) {
  const { colors, sizes, variants, blank } = product;

  const initialColorId = useMemo(() => {
    const def = product.images.find((i) => i.isDefault);
    if (def) {
      const v = variants.find((v) => def.variantIds.includes(v.id));
      if (v?.colorId != null) return v.colorId;
    }
    return colors[0]?.id ?? null;
  }, [product.images, variants, colors]);

  const [colorId, setColorId] = useState<number | null>(initialColorId);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const color = colors.find((c) => c.id === colorId) ?? null;
  const colorVariants = colorId == null ? variants : variants.filter((v) => v.colorId === colorId);

  const gallery = useMemo(() => {
    const ids = new Set(colorVariants.map((v) => v.id));
    const forColor = product.images.filter((img) => img.variantIds.some((id) => ids.has(id)));
    return sortImages(forColor.length ? forColor : product.images);
  }, [colorVariants, product.images]);

  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)];

  const selectedVariant =
    sizeId == null ? null : colorVariants.find((v) => v.sizeId === sizeId) ?? null;

  const colorPrices = colorVariants.map((v) => v.price);
  const priceLabel = selectedVariant
    ? formatPrice(selectedVariant.price)
    : colorPrices.length && Math.min(...colorPrices) !== Math.max(...colorPrices)
      ? `${formatPrice(Math.min(...colorPrices))} – ${formatPrice(Math.max(...colorPrices))}`
      : formatPrice(colorPrices[0] ?? product.priceMin);

  function selectColor(id: number) {
    setColorId(id);
    setImageIndex(0);
    // Keep the chosen size only if it exists in the new colorway.
    if (sizeId != null && !variants.some((v) => v.colorId === id && v.sizeId === sizeId && v.available)) {
      setSizeId(null);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      {/* Gallery */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-ink-3">
          {activeImage ? (
            <Image
              key={activeImage.src}
              src={activeImage.src}
              alt={`${product.title}${color ? ` in ${color.name}` : ""} — ${activeImage.position.replace("_", " ")} view`}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="display absolute inset-0 grid place-items-center text-5xl text-muted">MPA</span>
          )}
        </div>
        {gallery.length > 1 && (
          <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Product images">
            {gallery.slice(0, 12).map((img, i) => (
              <li key={img.src}>
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show ${img.position.replace("_", " ")} view`}
                  aria-pressed={img === activeImage}
                  className={`relative block aspect-square w-full overflow-hidden border bg-ink-3 ${
                    img === activeImage ? "border-signal" : "border-line hover:border-paper-dim"
                  }`}
                >
                  <Image src={img.src} alt="" fill sizes="96px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Buy box */}
      <div className="flex flex-col gap-8">
        <header>
          {blank && <p className="eyebrow text-signal">{blank.name} / {blank.weight}</p>}
          <h1 className="display mt-3 text-5xl sm:text-6xl">{product.title}</h1>
          {product.subtitle && <p className="mt-3 text-sm text-paper-dim">{product.subtitle}</p>}
          <p className="mt-5 font-mono text-2xl" aria-live="polite">
            {priceLabel}
          </p>
        </header>

        {colors.length > 0 && (
          <fieldset>
            <legend className="eyebrow mb-3 flex w-full justify-between">
              <span>Color</span>
              <span className="text-paper-dim">
                {color?.name}
                {color && <span className="ml-2 text-muted">/ {color.tone === "dark" ? "Dark" : "Light"} colorway</span>}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const selected = c.id === colorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectColor(c.id)}
                    aria-pressed={selected}
                    aria-label={c.name}
                    title={c.name}
                    className={`size-9 rounded-full border-2 transition-transform ${
                      selected ? "scale-110 border-signal" : "border-line hover:border-paper-dim"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset>
            <legend className="eyebrow mb-3 flex w-full justify-between">
              <span>Size</span>
              {blank && <span className="text-muted">Chest × Length (in)</span>}
            </legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {sizes.map((s) => {
                const variant = colorVariants.find((v) => v.sizeId === s.id);
                const disabled = !variant || !variant.available;
                const selected = s.id === sizeId;
                const m = getMeasurement(blank, s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSizeId(selected ? null : s.id)}
                    aria-pressed={selected}
                    aria-label={`${s.name}${m ? `, chest ${m.chest} inches, length ${m.length} inches` : ""}${disabled ? ", unavailable" : ""}`}
                    className={`flex flex-col items-center gap-0.5 border px-2 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                      selected ? "border-paper bg-paper text-ink" : "border-line hover:border-paper-dim"
                    }`}
                  >
                    <span className="text-sm font-semibold">{s.name}</span>
                    {m && (
                      <span className={`font-mono text-[0.625rem] ${selected ? "text-ink/70" : "text-muted"}`}>
                        {formatInches(m.chest)} × {formatInches(m.length)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {product.isGarment && (
              <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                <span className="eyebrow mr-2 text-paper">Fit</span>
                {FIT_COPY}
              </p>
            )}
          </fieldset>
        )}

        {/* Checkout routes straight to this item on the Printify Pop-Up store. */}
        <div className="flex flex-col gap-3">
          <a
            href={product.popupUrl}
            className="display bg-signal px-6 py-4 text-center text-2xl text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Buy Now
          </a>
          <a
            href={product.popupUrl}
            className="eyebrow border border-paper px-6 py-3.5 text-center font-semibold transition-colors hover:bg-paper hover:text-ink"
          >
            Add to Cart
          </a>
          <p className="text-xs leading-relaxed text-muted">
            {CHECKOUT_NOTE}
            {(color || selectedVariant) && (
              <>
                {" "}Confirm{" "}
                <span className="text-paper-dim">
                  {[color?.name, sizes.find((s) => s.id === sizeId)?.name].filter(Boolean).join(" / ")}
                </span>{" "}
                on the next page.
              </>
            )}
          </p>
        </div>

        {product.isGarment && <PrintProfile activeTone={color?.tone} />}
      </div>
    </div>
  );
}
