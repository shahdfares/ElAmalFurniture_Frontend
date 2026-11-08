import { Product } from 'shared';

export const STORE_WHATSAPP = '20XXXXXXXXXX'; // رقم واتساب المحل بكود الدولة من غير + أو أصفار
export const FB_APP_ID = '';                  // اختياري: لـ Messenger على الكمبيوتر

export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).share;
}

export function buildInquiryLink(p: Product | null): string {
  const msg = `Hello, I'd like to inquire about: ${p?.name}${p?.code ? ' (Ref. ' + p.code + ')' : ''}\n${window.location.href}`;
  return `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

export function shareToNetwork(network: string, p: Product): void {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(p.name ?? '');
  const media = encodeURIComponent(p.productImages?.[0]?.imagesUrl ?? '');
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  const links: Record<string, string> = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    messenger: isMobile
      ? `fb-messenger://share/?link=${url}`
      : `https://www.facebook.com/dialog/send?link=${url}&app_id=${FB_APP_ID}&redirect_uri=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${text}`,
    x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    email: `mailto:?subject=${text}&body=${url}`,
  };

  if (network === 'email') {
    window.location.href = links[network];
  } else {
    window.open(links[network], '_blank', 'noopener');
  }
}

export async function copyPageLink(): Promise<void> {
  await navigator.clipboard.writeText(window.location.href);
}

export function nativeShareProduct(p: Product): void {
  (navigator as any)
    .share({ title: p.name, url: window.location.href })
    .catch(() => {});
}
