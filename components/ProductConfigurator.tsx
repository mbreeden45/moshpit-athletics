"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatInches } from "@/lib/blanks";
import type { CartItem } from "@/lib/cart";
import { CARE_COPY, FIT_COPY, PDP_NOTE, PRINT_METHOD_COPY, PRINT_PROFILE, SHIPPING_RETURNS } from "@/lib/copy";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice, storySections, type ProductImage, type StorefrontProduct } from "@/lib/product";
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
  const { add } = useCart();

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
  const scroller = useRef<HTMLDivElement>(null);
  const galleryKey = gallery.map((img) => img.src).join("|");

  // New colour or blank: back to the first photo.
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setImageIndex(0);
  }, [galleryKey]);

  function showImage(i: number) {
    const el = scroller.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setImageIndex(i);
  }

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
    const url = new URL(window.location.href);
    if (i === 0) url.searchParams.delete("blank");
    else url.searchParams.set("blank", next.blankKey);
    window.history.replaceState(window.history.state, "", url);
  }

  function selectColor(id: number) {
    setColorId(id);
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

  const spec = product.spec;
  // The seller's words about the design lead; without them, the blank's spec summary stands in.
  const { about, notes } = storySections(product.story);
  const description = about.length > 0 ? about : [spec?.summary ?? "Printed to order in the USA."];
  // When the story fills the description, the blank's summary moves into details.
  const blankSummary = about.length > 0 ? spec?.summary : undefined;
  const specPoints = [
    // Prints' spec copy already covers their inks.
    ...product.printMethods.filter((m) => m !== "digital").map((m) => PRINT_METHOD_COPY[m]),
    ...(spec?.points ?? []),
  ];
  const isDtgGarment = product.isGarment && product.printMethods.length === 1 && product.printMethods[0] === "dtg";
  const sizeChoices = sizes.length > 1;

  const colorPicker = colors.length > 1 && (
    <fieldset className="max-md:order-6">
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
              className={`relative size-[52px] cursor-pointer overflow-hidden border p-1 ${
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
  );

  /*
   * Phones follow the Supreme order: title, swipeable photos, size + add to
   * cart, color and price, swatches, description. From md up it's two
   * columns: photos left, everything else right. Below md the right column
   * is `display: contents`, so `max-md:order-*` places its children.
   */
  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col gap-6 px-4 max-md:pt-3 md:grid md:grid-cols-[minmax(0,1fr)_300px] md:items-start md:gap-12">
      {/* Photos: a swipeable strip on phones; thumbnails pick the angle on desktop */}
      <div className="flex flex-col gap-3 max-md:order-2">
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== imageIndex) setImageIndex(i);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {gallery.length === 0 && (
            <div className="flex aspect-square w-full items-center justify-center bg-panel text-muted">{design.name}</div>
          )}
          {gallery.map((img, i) => (
            <div key={img.src} className="relative aspect-square w-full shrink-0 snap-start bg-panel">
              <Image
                src={img.src}
                alt={`${design.name}${color ? `, ${color.name}` : ""} — ${positionLabel(img.position)}`}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 420px, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {gallery.length > 1 && (
          <div className="flex flex-wrap gap-2 max-md:justify-center">
            {gallery.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => showImage(i)}
                aria-pressed={i === imageIndex}
                aria-label={`View ${positionLabel(img.position)}`}
                className={`relative cursor-pointer overflow-hidden bg-panel max-md:size-1.5 max-md:rounded-full md:size-12 md:border ${
                  i === imageIndex
                    ? "max-md:bg-fg md:border-fg"
                    : "max-md:bg-faint md:border-transparent md:hover:border-faint"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="48px" className="object-cover max-md:hidden" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details and buy */}
      <div className="max-md:contents md:flex md:flex-col md:gap-5">
        <div className="max-md:order-1">
          <h1 className="text-[16px] leading-tight">{design.name}</h1>
          {product.subtitle && <p className="mt-0.5">{product.subtitle}</p>}
          {color && <p className="mt-0.5 font-bold max-md:hidden">{color.name}</p>}
        </div>

        <div className="flex flex-col gap-2 leading-[1.35] max-md:order-7" aria-live="polite">
          {description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {design.products.length > 1 && (
          <label className="flex flex-col gap-1 max-md:order-3">
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

        {/* Desktop: swatches sit above the price */}
        {colorPicker && <div className="max-md:hidden">{colorPicker}</div>}

        <div className="flex flex-col gap-1 max-md:hidden">
          <p className="text-[16px]" aria-live="polite">
            {fromPrefix}
            {formatPrice(price)}
          </p>
          <EtsyRating />
        </div>

        <div className="flex flex-col gap-2 max-md:order-4">
          <div className="grid grid-cols-2 gap-2">
            {sizeChoices && (
              <label className="md:col-span-2">
                <span className="sr-only">Size</span>
                <select
                  value={sizeId ?? ""}
                  onChange={(e) => {
                    setSizeId(e.target.value ? Number(e.target.value) : null);
                    setNeedSize(false);
                  }}
                  className="select-flat h-full text-center font-bold"
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
            <button
              type="button"
              onClick={addToCart}
              className={`mpa-buy btn bg-accent text-white hover:brightness-110 max-md:py-2 ${sizeChoices ? "" : "max-md:col-span-2"}`}
            >
              add to cart
            </button>
            <Link href="/" className="mpa-buy btn bg-fg text-bg hover:opacity-85 max-md:hidden">
              keep shopping
            </Link>
          </div>
          {needSize && (
            <p role="alert" className="text-accent">
              {selectedVariant ? "that one is sold out." : "pick a size first."}
            </p>
          )}
          <p className="text-accent max-md:hidden">* {PDP_NOTE}</p>
        </div>

        {/* Phones: color name and price on one line, swatches under it */}
        <div className="flex items-baseline justify-between text-[13px] md:hidden max-md:order-5">
          <span className="font-bold">{color?.name ?? ""}</span>
          <span aria-live="polite">
            {fromPrefix}
            {formatPrice(price)}
          </span>
        </div>
        <div className="contents md:hidden">{colorPicker}</div>

        <div className="flex flex-col gap-1 md:hidden max-md:order-8">
          <p className="text-accent">* {PDP_NOTE}</p>
          <EtsyRating />
        </div>

        <div className="border-b border-faint max-md:order-9">
          <Info title="details">
            {notes.length > 0 && (
              <ul className="list-['–_'] pl-3">
                {notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {blankSummary && <p>{blankSummary}</p>}
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
