"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckoutErrorPanel } from "@/components/dashboard/CheckoutErrorPanel";
import { PolicyDisclosure } from "@/components/dashboard/PolicyDisclosure";
import { NeonButton } from "@/components/ui/NeonButton";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="credit-modal-title"
    >
      <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 sm:p-8">
        <h2 id="credit-modal-title" className="neon-text text-xl font-bold">
          クレジット追加
        </h2>

        <div className="my-6 rounded-xl border border-cyan-500/20 bg-black/30 p-5 text-center">
          <p className="text-2xl font-bold text-white">
            {CREDIT_PACK_AMOUNT.toLocaleString()}円
          </p>
          <p className="my-3 text-cyan-400">↓</p>
          <p className="text-lg font-semibold text-cyan-200">
            {CREDIT_PACK_ADD.toLocaleString()} Credit 追加
          </p>
        </div>

        <ul className="mb-6 space-y-2 text-xs leading-relaxed text-slate-400">
          <li>• 決済完了後、クレジットはアカウントに反映されます</li>
          <li>
            • デジタルサービスのため、決済完了後のキャンセル・返金は原則できません
          </li>
          <li>• 決済処理は Stripe を通じて安全に行われます</li>
        </ul>

        <div className="space-y-4">
          <PolicyDisclosure
            buttonLabel="利用規約を見る"
            items={TERMS_OF_SERVICE_ITEMS}
          />
          <PolicyDisclosure
            buttonLabel="キャンセルポリシーを見る"
            items={CANCEL_POLICY_ITEMS}
          />

          <div className="space-y-3 border-t border-cyan-500/15 pt-4 text-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 accent-cyan-400"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
              />
              <span>利用規約を確認し、同意しました</span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 accent-cyan-400"
                checked={cancelAccepted}
                onChange={(e) => setCancelAccepted(e.target.checked)}
                disabled={loading}
              />
              <span>キャンセルポリシーを確認し、同意しました</span>
            </label>
          </div>
        </div>

        {displayError ? <CheckoutErrorPanel error={displayError} /> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NeonButton
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            キャンセル
          </NeonButton>
          <NeonButton
            type="button"
            onClick={handleCheckout}
            disabled={!canPay}
            loading={loading}
          >
            決済へ進む
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
