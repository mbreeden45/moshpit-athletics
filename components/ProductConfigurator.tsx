"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatInches } from "@/lib/blanks";
import type { CartItem } from "@/lib/cart";
import { CARE_COPY, FIT_COPY, PDP_NOTE, PRINT_METHOD_COPY, PRINT_PROFILE, SHIPPING_RETURNS } from "@/lib/copy";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice, type ProductImage, type StorefrontProduct } from "@/lib/product";
import { SUPPORT_MAILTO } from "@/lib/site";
import { BRAND_DISCLAIMER } from "@/lib/specs";
import { useCart } from "./CartProvider";
import { EtsyRating } from "./EtsyRating";

const POSITION_ORDER = ["front", "back", "folded", "left_sleeve", "right_sleeve", "other"];
const MAX_GALLERY = 7;

function sortImages(images: ProductImage[]): ProductImage[] {
  const rank = (p: string) => {
    const i = POSITION_ORDER.indexOf(p);
    return i === -1 ? POSITION_ORDER.length : i;
  };
  return [...images].sort((a, b) => rank(a.position) - rank(b.position));
}

function positionLabel(p: string): string {
  return p.replace(/_/g, " ");
}

/** The colour shown in the product's default mockup. */
function initialColorId(product: StorefrontProduct): number | null {
  const def = product.images.find((i) => i.isDefault);
  if (def) {
    const v = product.variants.find((v) => def.variantIds.includes(v.id));
    if (v?.colorId != null) return v.colorId;
  }
  return product.colors[0]?.id ?? null;
}

/** Lead photo for each colour, for the swatch thumbnails. */
function colorThumb(product: StorefrontProduct, colorId: number): string | null {
  const ids = new Set(product.variants.filter((v) => v.colorId === colorId).map((v) => v.id));
  return sortImages(product.images.filter((img) => img.variantIds.some((id) => ids.has(id))))[0]?.src ?? null;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Collapsed info block. Closed by default, but its text is in the page for search engines. */
function Info({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-t border-faint py-2">
      <summary className="flex cursor-pointer list-none justify-between [&::-webkit-details-marker]:hidden">
        <span className="group-open:font-bold">{title}</span>
        <span aria-hidden="true">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="flex flex-col gap-2 pb-1 pt-2 leading-[1.35]">{children}</div>
    </details>
  );
}

export function ProductConfigurator({ design }: { design: StorefrontDesign }) {
  const [blankIndex, setBlankIndex] = useState(0);
  const product = design.products[blankIndex] ?? design.products[0];
  const { colors, sizes, variants, blank } = product;

  const [colorId, setColorId] = useState<number | null>(() => initialColorId(product));
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [needSize, setNeedSize] = useState(false);
  const { add, buyNow } = useCart();

  // Old per-product links land here with ?blank=<key>.
  useEffect(() => {
    if (design.products.length < 2) return;
    const key = new URLSearchParams(window.location.search).get("blank");
    const i = design.products.findIndex((p) => p.blankKey === key);
    if (i > 0) {
      setBlankIndex(i);
      setColorId(initialColorId(design.products[i]));
    }
  }, [design]);

  const color = colors.find((c) => c.id === colorId) ?? null;
  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const colorVariants = colorId == null ? variants : variants.filter((v) => v.colorId === colorId);

  const gallery = useMemo(() => {
    const ids = new Set(colorVariants.map((v) => v.id));
    const forColor = product.images.filter((img) => img.variantIds.some((id) => ids.has(id)));
    return sortImages(forColor.length ? forColor : product.images).slice(0, MAX_GALLERY);
  }, [colorVariants, product.images]);
  const mainImage = gallery[imageIndex] ?? gallery[0] ?? null;

  // One-size items (caps) and size-less items (prints) don't need a size pick.
  const effectiveSize = size ?? (sizes.length === 1 ? sizes[0] : null);
  const selectedVariant = effectiveSize
    ? colorVariants.find((v) => v.sizeId === effectiveSize.id) ?? null
    : sizes.length === 0
      ? colorVariants[0] ?? null
      : null;
  const price = selectedVariant?.price ?? Math.min(...colorVariants.map((v) => v.price), product.priceMax);
  const fromPrefix = !selectedVariant && colorVariants.some((v) => v.price !== price) ? "from " : "";

  /** Switch blanks, carrying over the colour and size names where the new blank has them. */
  function selectBlank(i: number) {
    const next = design.products[i];
    if (!next || i === blankIndex) return;
    const nextColor = (color && next.colors.find((c) => sameName(c.name, color.name))?.id) ?? initialColorId(next);
    const nextSize = size ? next.sizes.find((s) => sameName(s.name, size.name)) : undefined;
    const sizeOk =
      nextSize && next.variants.some((v) => v.colorId === nextColor && v.sizeId === nextSize.id && v.available);
    setBlankIndex(i);
    setColorId(nextColor);
    setSizeId(sizeOk ? nextSize.id : null);
    setImageIndex(0);
    const url = new URL(window.location.href);
    if (i === 0) url.searchParams.delete("blank");
    else url.searchParams.set("blank", next.blankKey);
    window.history.replaceState(window.history.state, "", url);
  }

  function selectColor(id: number) {
    setColorId(id);
    setImageIndex(0);
    if (sizeId != null && !variants.some((v) => v.colorId === id && v.sizeId === sizeId && v.available)) {
      setSizeId(null);
    }
  }

  /** The current selection as a cart line, or null (and a size prompt) if incomplete. */
  function cartItem(): CartItem | null {
    if (!selectedVariant || !selectedVariant.available) {
      setNeedSize(true);
      return null;
    }
    const image =
      sortImages(product.images.filter((img) => img.variantIds.includes(selectedVariant.id)))[0]?.src ??
      gallery[0]?.src ??
      product.defaultImage;
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: 1,
      slug: design.slug,
      name: design.name,
      detail: [design.products.length > 1 ? design.optionLabels[blankIndex] : null, color?.name, effectiveSize?.name]
        .filter(Boolean)
        .join(" / "),
      price: selectedVariant.price,
      image,
    };
  }

  function addToCart() {
    const item = cartItem();
    if (item) add(item);
  }

  function buyItNow() {
    const item = cartItem();
    if (item) buyNow(item);
  }

  const spec = product.spec;
  // Style designs carry each style's own words; everything else gets the blank's spec summary.
  const description = [
    ...(design.picker === "Style" ? product.story : []),
    spec?.summary ?? "Printed to order in the USA.",
  ];
  const specPoints = [
    // Prints' spec copy already covers their inks.
    ...product.printMethods.filter((m) => m !== "digital").map((m) => PRINT_METHOD_COPY[m]),
    ...(spec?.points ?? []),
  ];
  const isDtgGarment = product.isGarment && product.printMethods.length === 1 && product.printMethods[0] === "dtg";
  const sizeChoices = sizes.length > 1;

  return (
    <div className="mx-auto grid w-full max-w-[780px] gap-6 px-4 md:grid-cols-[minmax(0,1fr)_300px] md:gap-12">
      {/* Photo, then the other angles for this colour */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square overflow-hidden bg-panel">
          {mainImage ? (
            <Image
              key={mainImage.src}
              src={mainImage.src}
              alt={`${design.name}${color ? `, ${color.name}` : ""} — ${positionLabel(mainImage.position)}`}
              fill
              priority
              sizes="(min-width: 780px) 420px, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-muted">{design.name}</span>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {gallery.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setImageIndex(i)}
                aria-pressed={img === mainImage}
                aria-label={`View ${positionLabel(img.position)}`}
                className={`relative size-12 cursor-pointer overflow-hidden border bg-panel ${
                  img === mainImage ? "border-fg" : "border-transparent hover:border-faint"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details and buy */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[16px] leading-tight">{design.name}</h1>
          {product.subtitle && <p className="mt-0.5">{product.subtitle}</p>}
          {color && <p className="mt-0.5 font-bold">{color.name}</p>}
        </div>

        <div className="flex flex-col gap-2 leading-[1.35] max-md:order-1" aria-live="polite">
          {description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {design.products.length > 1 && (
          <label className="flex flex-col gap-1">
            <span className="sr-only">{design.picker}</span>
            <select
              value={blankIndex}
              onChange={(e) => selectBlank(Number(e.target.value))}
              className="select-flat"
            >
              {design.products.map((p, i) => (
                <option key={p.id} value={i}>
                  {`${design.optionLabels[i]} — ${p.priceMin !== p.priceMax ? "from " : ""}${formatPrice(p.priceMin)}`}
                </option>
              ))}
            </select>
          </label>
        )}

        {colors.length > 1 && (
          <fieldset>
            <legend className="sr-only">Color</legend>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => {
                const selected = c.id === colorId;
                const thumb = colorThumb(product, c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectColor(c.id)}
                    aria-pressed={selected}
                    aria-label={c.name}
                    title={c.name}
                    className={`relative size-11 cursor-pointer overflow-hidden border p-0.5 ${
                      selected ? "border-fg" : "border-transparent hover:border-faint"
                    }`}
                  >
                    {thumb ? (
                      <span className="relative block size-full bg-panel">
                        <Image src={thumb} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                    ) : (
                      <span className="block size-full border border-faint" style={{ backgroundColor: c.hex }} />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-[16px]" aria-live="polite">
            {fromPrefix}
            {formatPrice(price)}
          </p>
          <EtsyRating />
        </div>

        <div className="flex flex-col gap-2">
          {sizeChoices && (
            <label>
              <span className="sr-only">Size</span>
              <select
                value={sizeId ?? ""}
                onChange={(e) => {
                  setSizeId(e.target.value ? Number(e.target.value) : null);
                  setNeedSize(false);
                }}
                className="select-flat text-center font-bold"
              >
                <option value="">select size</option>
                {sizes.map((s) => {
                  const variant = colorVariants.find((v) => v.sizeId === s.id);
                  const soldOut = !variant || !variant.available;
                  return (
                    <option key={s.id} value={s.id} disabled={soldOut}>
                      {s.name}
                      {soldOut ? " — sold out" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          {needSize && (
            <p role="alert" className="text-accent">
              {selectedVariant ? "that one is sold out." : "pick a size first."}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={addToCart} className="mpa-buy btn bg-accent text-white hover:brightness-110">
              add to cart
            </button>
            <button type="button" onClick={buyItNow} className="mpa-buy btn bg-fg text-bg hover:opacity-85">
              buy now
            </button>
          </div>
          <p className="text-accent">* {PDP_NOTE}</p>
        </div>

        <div className="border-b border-faint max-md:order-2">
          <Info title="details">
            {specPoints.length > 0 && (
              <ul className="list-['–_'] pl-3">
                {specPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {isDtgGarment && (
              <>
                <p>
                  <span className="font-bold">{PRINT_PROFILE.dark.label}:</span> {PRINT_PROFILE.dark.body}
                </p>
                <p>
                  <span className="font-bold">{PRINT_PROFILE.light.label}:</span> {PRINT_PROFILE.light.body}
                </p>
                <p>{PRINT_PROFILE.notice}</p>
              </>
            )}
            {spec && product.brandNamed && <p className="text-muted">{BRAND_DISCLAIMER}</p>}
          </Info>

          {product.isGarment && (
            <Info title="sizing">
              <p>{FIT_COPY}</p>
              {blank && (
                <>
                  <table className="w-full text-left">
                    <caption className="pb-1 text-left text-muted">
                      {blank.name}, flat measurements in inches
                    </caption>
                    <thead>
                      <tr className="border-b border-faint">
                        <th scope="col" className="py-1 font-bold">size</th>
                        <th scope="col" className="py-1 font-bold">chest</th>
                        <th scope="col" className="py-1 font-bold">length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(blank.measurements).map(([name, m]) => (
                        <tr key={name}>
                          <th scope="row" className="py-0.5 font-normal">{name}</th>
                          <td className="py-0.5">{formatInches(m.chest)}</td>
                          <td className="py-0.5">{formatInches(m.length)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-muted">
                    {blank.weight} · {blank.fabric.toLowerCase()} · {blank.cut.toLowerCase()}
                  </p>
                </>
              )}
            </Info>
          )}

          {product.isGarment && (
            <Info title="care">
              <p>{CARE_COPY}</p>
            </Info>
          )}

          <Info title="shipping & returns">
            <p>
              {SHIPPING_RETURNS.lead}
              <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
                {SHIPPING_RETURNS.linkText}
              </a>
              {SHIPPING_RETURNS.tail}
            </p>
          </Info>
        </div>
      </div>
    </div>
  );
}
