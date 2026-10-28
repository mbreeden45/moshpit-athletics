"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getMeasurement } from "@/lib/blanks";
import { CARE_COPY, CHECKOUT_NOTE, FIT_COPY, SHIPPING_RETURNS, TOP_BANNER } from "@/lib/copy";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice, type ProductImage, type StorefrontProduct } from "@/lib/product";
import { SUPPORT_MAILTO } from "@/lib/site";
import { GarmentBlueprint } from "./GarmentBlueprint";
import { PrintProfile } from "./PrintProfile";

const POSITION_ORDER = ["front", "back", "folded", "left_sleeve", "right_sleeve", "other"];
const MAX_GALLERY = 7;
const DROP_LABEL = TOP_BANNER.split("/")[0].trim(); // "Drop 07"

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

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

type Props = {
  design: StorefrontDesign;
  /** h1 on the PDP, h2 when featured on the home page. */
  as?: "h1" | "h2";
  /** PDP only: fixed mobile buy bar and ?blank= kept in the URL. */
  stickyBar?: boolean;
  /** Anchor id for the garment blueprint section. */
  blueprintId?: string;
};

export function ProductConfigurator({ design, as: Heading = "h1", stickyBar = false, blueprintId }: Props) {
  const [blankIndex, setBlankIndex] = useState(0);
  const product = design.products[blankIndex] ?? design.products[0];
  const { colors, sizes, variants, blank } = product;

  const [colorId, setColorId] = useState<number | null>(() => initialColorId(product));
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [openPanel, setOpenPanel] = useState(0);

  // Old per-product links land here with ?blank=<key>.
  useEffect(() => {
    if (!stickyBar || design.products.length < 2) return;
    const key = new URLSearchParams(window.location.search).get("blank");
    const i = design.products.findIndex((p) => p.blankKey === key);
    if (i > 0) {
      setBlankIndex(i);
      setColorId(initialColorId(design.products[i]));
    }
  }, [design, stickyBar]);

  const color = colors.find((c) => c.id === colorId) ?? null;
  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const colorVariants = colorId == null ? variants : variants.filter((v) => v.colorId === colorId);

  const gallery = useMemo(() => {
    const ids = new Set(colorVariants.map((v) => v.id));
    const forColor = product.images.filter((img) => img.variantIds.some((id) => ids.has(id)));
    const sorted = sortImages(forColor.length ? forColor : product.images).slice(0, MAX_GALLERY);
    // Lead shot + an even count keeps the 2-up grid free of empty cells.
    return sorted.length > 1 && sorted.length % 2 === 0 ? sorted.slice(0, -1) : sorted;
  }, [colorVariants, product.images]);

  const selectedVariant = size ? colorVariants.find((v) => v.sizeId === size.id) ?? null : null;
  const price = selectedVariant?.price ?? Math.min(...colorVariants.map((v) => v.price), product.priceMax);
  const fromPrefix = !selectedVariant && colorVariants.some((v) => v.price !== price) ? "From " : "";
  const priceLabel = `${fromPrefix}${formatPrice(price, true)}`;

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
    if (stickyBar) {
      const url = new URL(window.location.href);
      if (i === 0) url.searchParams.delete("blank");
      else url.searchParams.set("blank", next.blankKey);
      window.history.replaceState(window.history.state, "", url);
    }
  }

  function selectColor(id: number) {
    setColorId(id);
    if (sizeId != null && !variants.some((v) => v.colorId === id && v.sizeId === sizeId && v.available)) {
      setSizeId(null);
    }
  }

  const panels: { title: string; body: ReactNode; list: string[] }[] = [
    {
      title: product.isGarment ? "Garment specs" : "Details",
      body: blank
        ? `${blank.fabric}, ${blank.weight}. ${blank.collar}. ${blank.cut}. Printed to order in the USA.`
        : product.descriptionParagraphs.slice(0, 3).join(" ") ||
          "Printed to order in the USA.",
      list: blank ? [] : product.descriptionBullets.slice(0, 8),
    },
    ...(product.isGarment ? [{ title: "Care", body: CARE_COPY, list: [] }] : []),
    {
      title: "Shipping and returns",
      body: (
        <>
          {SHIPPING_RETURNS.lead}
          <a href={SUPPORT_MAILTO} className="text-paper underline underline-offset-2 hover:text-rust">
            {SHIPPING_RETURNS.linkText}
          </a>
          {SHIPPING_RETURNS.tail}
        </>
      ),
      list: [],
    },
  ];

  const panelBg = color?.tone === "light" ? "bg-panel-light" : "bg-panel";

  return (
    <>
      <section className="flex flex-wrap items-start border-t border-line">
        {/* Gallery: lead shot full-width, then a 2-up grid */}
        <div className="grid flex-[1_1_560px] grid-cols-2 gap-px bg-line">
          {gallery.length === 0 && (
            <div className={`col-span-2 flex aspect-[1/1.1] items-end p-5 label ${panelBg} text-placeholder`}>
              Photo: {design.name}
            </div>
          )}
          {gallery.map((img, i) => (
            <div
              key={img.src}
              className={`relative overflow-hidden ${panelBg} ${i === 0 ? "col-span-2 aspect-[1/1.1]" : "aspect-square"}`}
            >
              <Image
                src={img.src}
                alt={`${design.name}${color ? `, ${color.name}` : ""} — ${positionLabel(img.position)}`}
                fill
                priority={i === 0}
                sizes={i === 0 ? "(min-width: 1000px) 57vw, 100vw" : "(min-width: 1000px) 28vw, 50vw"}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Buy panel */}
        <div className="flex flex-[1_1_420px] flex-col gap-6 border-line px-4 py-10 sm:px-8 lg:sticky lg:top-[60px] lg:border-l">
          <p className="uppercase text-rust">
            {DROP_LABEL} / {product.kind.many}
          </p>
          <div>
            <Heading className="headline-xl text-[clamp(56px,6vw,96px)] leading-[0.88]">{design.name}</Heading>
            {product.subtitle && <p className="label mt-4 normal-case">{product.subtitle}</p>}
          </div>
          <p className="text-[24px]" aria-live="polite">
            {priceLabel}
          </p>

          {design.products.length > 1 && (
            <fieldset>
              <legend className="mb-2.5 uppercase">Blank: {product.blankLabel}</legend>
              <div className="flex flex-col gap-2">
                {design.products.map((p, i) => {
                  const selected = i === blankIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectBlank(i)}
                      aria-pressed={selected}
                      className={`flex cursor-pointer justify-between gap-4 border px-4 py-3.5 text-left text-[13px] ${
                        selected ? "border-paper bg-paper text-ink" : "border-edge hover:border-muted"
                      }`}
                    >
                      <span>{p.blankLabel}</span>
                      <span className="shrink-0">
                        {p.priceMin !== p.priceMax && "From "}
                        {formatPrice(p.priceMin)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {colors.length > 1 && (
            <fieldset>
              <legend className="mb-2.5 uppercase">Color: {color?.name}</legend>
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
                      className={`size-8 cursor-pointer border p-[3px] ${selected ? "border-paper" : "border-edge hover:border-muted"}`}
                    >
                      <span className="block size-full" style={{ backgroundColor: c.hex }} />
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset>
              <legend className="mb-2.5 uppercase">Size: {size?.name ?? "Select"}</legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
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
                      className={`cursor-pointer whitespace-nowrap border px-2 py-3.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                        selected ? "border-paper bg-paper text-ink" : "border-edge hover:border-muted"
                      }`}
                    >
                      {s.name}
                      {m && ` (${m.chest}" x ${m.length}")`}
                    </button>
                  );
                })}
              </div>
              {product.isGarment && <p className="prose-body mt-3 text-muted">{FIT_COPY}</p>}
            </fieldset>
          )}

          {/* Checkout routes straight to this item on the Printify Pop-Up store. */}
          <div className="flex flex-col gap-6">
            <a
              href={product.popupUrl}
              className="border border-paper bg-paper p-5 text-center text-[14px] font-medium uppercase tracking-[0.06em] text-ink hover:border-rust hover:bg-rust hover:text-paper"
            >
              Add to cart / {formatPrice(price, true)}
            </a>
            <a
              href={product.popupUrl}
              className="border border-paper bg-black p-[18px] text-center text-[14px] font-medium hover:bg-panel"
            >
              Buy now
            </a>
            <p className="label -mt-3 normal-case tracking-normal">
              {CHECKOUT_NOTE}
              {(color || size) && (
                <span className="text-paper"> {[color?.name, size?.name].filter(Boolean).join(" / ")}</span>
              )}
            </p>
          </div>

          {product.isGarment && <PrintProfile activeTone={color?.tone} />}

          <div className="border-t border-line">
            {panels.map((panel, i) => {
              const open = openPanel === i;
              const id = `${product.id}-panel-${i}`;
              return (
                <div key={panel.title} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpenPanel(open ? -1 : i)}
                    aria-expanded={open}
                    aria-controls={id}
                    className="flex w-full cursor-pointer justify-between py-4 text-left uppercase"
                  >
                    <span>{panel.title}</span>
                    <span aria-hidden="true">{open ? "-" : "+"}</span>
                  </button>
                  <div id={id} hidden={!open} className="prose-body pb-[18px]">
                    <p>{panel.body}</p>
                    {panel.list.length > 0 && (
                      <ul className="mt-3 list-['–_'] pl-4">
                        {panel.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {blank && <GarmentBlueprint blank={blank} id={blueprintId} />}

      {stickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-[1fr_1.4fr] border-t border-paper bg-ink md:hidden">
          <a
            href={product.popupUrl}
            className="border-r border-paper py-5 text-center uppercase tracking-[0.06em]"
          >
            Add to cart
          </a>
          <a href={product.popupUrl} className="bg-paper py-5 text-center font-medium uppercase tracking-[0.06em] text-ink">
            Buy now / {formatPrice(price)}
          </a>
        </div>
      )}
    </>
  );
}
