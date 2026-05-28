"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckoutErrorPanel } from "@/components/dashboard/CheckoutErrorPanel";
import { PolicyDisclosure } from "@/components/dashboard/PolicyDisclosure";
import { NeonButton } from "@/components/ui/NeonButton";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CANCEL_POLICY_ITEMS,
  TERMS_OF_SERVICE_ITEMS,
} from "@/lib/checkout-content";
import {
  formatCheckoutApiError,
  formatCheckoutNetworkError,
  type CheckoutApiErrorBody,
  type CheckoutDisplayError,
} from "@/lib/checkout-debug";
import {
  CREDIT_PACK_ADD,
  CREDIT_PACK_AMOUNT,
  CREDIT_PACK_CURRENCY,
  CREDIT_PACK_PRODUCT_NAME,
} from "@/lib/constants";

type CreditModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreditModal({ open, onClose }: CreditModalProps) {
  const { translate } = useLanguage();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cancelAccepted, setCancelAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayError, setDisplayError] = useState<CheckoutDisplayError | null>(
    null,
  );

  const canPay = termsAccepted && cancelAccepted && !loading;

  const handleClose = useCallback(() => {
    if (loading) return;
    setTermsAccepted(false);
    setCancelAccepted(false);
    setDisplayError(null);
    onClose();
  }, [loading, onClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open && !loading) {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, handleClose]);

  if (!open) return null;

  async function handleCheckout() {
    if (!canPay) return;

    setLoading(true);
    setDisplayError(null);

    const body = {
      addCredit: CREDIT_PACK_ADD,
      amount: CREDIT_PACK_AMOUNT,
      currency: CREDIT_PACK_CURRENCY,
      productName: CREDIT_PACK_PRODUCT_NAME,
      termsAccepted: true,
      cancelPolicyAccepted: true,
    };

    console.log("CLIENT_CHECKOUT_CLICKED");
    console.log("CLIENT_CHECKOUT_BODY", body);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: CheckoutApiErrorBody = {};
      const responseText = await response.text();

      try {
        data = responseText
          ? (JSON.parse(responseText) as CheckoutApiErrorBody)
          : {};
      } catch {
        data = { cause: responseText.slice(0, 500) };
      }

      console.log("CLIENT_CHECKOUT_RESPONSE_STATUS", response.status);
      console.log("CLIENT_CHECKOUT_RESPONSE", data);

      if (!response.ok) {
        console.error("CHECKOUT_ERROR", data);
        setDisplayError(
          formatCheckoutApiError(data, "/api/checkout がエラーを返しました。"),
        );
        return;
      }

      const checkoutUrl = data.checkoutUrl ?? data.url;
      if (!checkoutUrl) {
        console.error("CHECKOUT_ERROR", {
          step: "no_checkout_url",
          data,
        });
        setDisplayError(
          formatCheckoutApiError(
            data,
            "checkoutUrl / url がレスポンスにありません。",
          ),
        );
        return;
      }

      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      console.error("CHECKOUT_ERROR", checkoutError);
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "通信エラーが発生しました";
      setDisplayError(formatCheckoutNetworkError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="credit-modal-title"
    >
      <div className="glass-panel box-border max-h-[90vh] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto rounded-2xl p-5 sm:p-8">
        <h2 id="credit-modal-title" className="accent-heading text-xl font-bold">
          {translate("creditModalTitle")}
        </h2>

        <div className="my-6 rounded-xl border border-sky-100 bg-white p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-900">
            {translate("creditPriceYen", {
              amount: CREDIT_PACK_AMOUNT.toLocaleString(),
            })}
          </p>
          <p className="my-3 font-medium text-sky-600">↓</p>
          <p className="text-lg font-semibold text-sky-700">
            {translate("creditPackAdd", {
              amount: CREDIT_PACK_ADD.toLocaleString(),
            })}
          </p>
        </div>

        <ul className="mb-6 space-y-2 text-xs leading-relaxed text-slate-600">
          <li>{translate("creditNoteReflect")}</li>
          <li>{translate("creditNoteNoRefund")}</li>
          <li>{translate("creditNoteStripe")}</li>
        </ul>

        <div className="space-y-4">
          <PolicyDisclosure
            buttonLabel={translate("viewTerms")}
            items={TERMS_OF_SERVICE_ITEMS}
          />
          <PolicyDisclosure
            buttonLabel={translate("viewCancelPolicy")}
            items={CANCEL_POLICY_ITEMS}
          />

          <div className="space-y-3 border-t border-sky-100 pt-4 text-sm text-slate-700">
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 shrink-0 accent-sky-500"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
              />
              <span className="min-w-0 break-words">{translate("termsAgree")}</span>
            </label>
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 shrink-0 accent-sky-500"
                checked={cancelAccepted}
                onChange={(e) => setCancelAccepted(e.target.checked)}
                disabled={loading}
              />
              <span className="min-w-0 break-words">{translate("cancelPolicyAgree")}</span>
            </label>
          </div>
        </div>

        {displayError ? <CheckoutErrorPanel error={displayError} /> : null}

        <div className="mt-6 flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NeonButton
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {translate("cancel")}
          </NeonButton>
          <NeonButton
            type="button"
            onClick={handleCheckout}
            disabled={!canPay}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {translate("proceedToPayment")}
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
