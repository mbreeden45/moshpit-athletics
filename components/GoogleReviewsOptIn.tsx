"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: { load: (name: string, cb: () => void) => void; surveyoptin?: { render: (opts: object) => void } };
  }
}

/**
 * Google Customer Reviews opt-in on the order confirmation page. If the buyer
 * opts in, Google emails them a short survey after the estimated delivery
 * date; their answers become the store's seller rating on Google Shopping.
 * Nothing is sent to Google unless they opt in.
 */
export function GoogleReviewsOptIn(props: {
  merchantId: number;
  orderId: string;
  email: string;
  estimatedDeliveryDate: string; // YYYY-MM-DD
}) {
  useEffect(() => {
    window.renderOptIn = () => {
      window.gapi?.load("surveyoptin", () => {
        window.gapi?.surveyoptin?.render({
          merchant_id: props.merchantId,
          order_id: props.orderId,
          email: props.email,
          delivery_country: "US",
          estimated_delivery_date: props.estimatedDeliveryDate,
          opt_in_style: "BOTTOM_RIGHT_DIALOG",
        });
      });
    };
  }, [props.merchantId, props.orderId, props.email, props.estimatedDeliveryDate]);

  return <Script src="https://apis.google.com/js/platform.js?onload=renderOptIn" strategy="afterInteractive" />;
}
