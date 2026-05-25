export type CheckoutDisplayError = {
  title: string;
  cause: string;
  details?: string;
};

export type CheckoutApiErrorBody = {
  error?: string;
  cause?: string;
  details?: string;
  step?: string;
  checkoutUrl?: string;
  url?: string;
};

export function formatCheckoutApiError(
  data: CheckoutApiErrorBody,
  fallbackCause: string,
): CheckoutDisplayError {
  return {
    title: "決済ページの作成に失敗しました。",
    cause: data.cause ?? data.error ?? fallbackCause,
    details: [data.step ? `step: ${data.step}` : null, data.details]
      .filter(Boolean)
      .join("\n"),
  };
}

export function formatCheckoutNetworkError(message: string): CheckoutDisplayError {
  return {
    title: "決済ページの作成に失敗しました。",
    cause: message,
    details: "step: client_fetch_failed\n/api/checkout への通信に失敗しました。",
  };
}
