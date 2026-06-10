// Iyzico REST API v2 client (native fetch, iyzipay paketi gerekmez)
// Paket tercih edilirse: npm install iyzipay @types/iyzipay
//
// İmza algoritması:
//   hash = sha256(apiKey + randomKey + secretKey + JSON.stringify(body))
//   Authorization: IYZWS {apiKey}:{base64(hash)}
//   x-iyzi-rnd: {randomKey}

import { createHash, randomBytes } from 'crypto';

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface IyzicoPaymentCard {
  cardHolderName: string;
  cardNumber: string;
  expireYear: string;
  expireMonth: string;
  cvc: string;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category1: string;
  itemType: string;
  price: string;
}

export interface IyzicoCreatePaymentRequest {
  conversationId: string;
  price: string;
  paidPrice: string;
  currency?: string;
  installment?: number;
  paymentChannel?: string;
  paymentGroup?: string;
  paymentCard: IyzicoPaymentCard;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    gsmNumber?: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: IyzicoBasketItem[];
}

export interface IyzicoPaymentResult {
  status: 'success' | 'failure';
  errorCode?: string;
  errorMessage?: string;
  paymentId?: string;
  conversationId?: string;
  paidPrice?: string;
}

export function getIyzicoConfig(): IyzicoConfig {
  const apiKey    = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl   = process.env.IYZICO_BASE_URL ?? 'https://sandbox.iyzipay.com';

  if (!apiKey || !secretKey) {
    throw new Error('IYZICO_API_KEY veya IYZICO_SECRET_KEY tanımlanmamış.');
  }
  return { apiKey, secretKey, baseUrl };
}

function buildAuthHeader(config: IyzicoConfig, randomKey: string, body: object): Record<string, string> {
  const bodyStr = JSON.stringify(body);
  const toHash  = `${config.apiKey}${randomKey}${config.secretKey}${bodyStr}`;
  const hash    = createHash('sha256').update(toHash, 'utf8').digest('base64');
  return {
    Authorization: `IYZWS ${config.apiKey}:${hash}`,
    'x-iyzi-rnd':  randomKey,
    'Content-Type': 'application/json',
  };
}

// ── 3D Secure tipleri ────────────────────────────────────────────────────────

export interface Iyzico3DSInitResult {
  status: 'success' | 'failure';
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  /** base64 kodlu HTML — decode edip iframe'e veya yeni sekmeye yükle */
  threeDSHtmlContent?: string;
}

export interface Iyzico3DSAuthResult {
  status: 'success' | 'failure';
  errorCode?: string;
  errorMessage?: string;
  paymentId?: string;
  conversationId?: string;
  paidPrice?: string;
}

/** Adım 1: 3DS akışını başlat → bankanın HTML formunu al */
export async function initiate3DSPayment(
  config: IyzicoConfig,
  request: IyzicoCreatePaymentRequest & { callbackUrl: string },
): Promise<Iyzico3DSInitResult> {
  const body = {
    locale:         'tr',
    currency:       'TRY',
    installment:    1,
    paymentChannel: 'WEB',
    paymentGroup:   'PRODUCT',
    ...request,
  };

  const randomKey = randomBytes(12).toString('hex');
  const response  = await fetch(`${config.baseUrl}/payment/3dsecure/initialize`, {
    method:  'POST',
    headers: buildAuthHeader(config, randomKey, body),
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Iyzico 3DS init HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    status:               string;
    errorCode?:           string;
    errorMessage?:        string;
    conversationId?:      string;
    threeDSHtmlContent?:  string;
  };

  return {
    status:              data.status === 'success' ? 'success' : 'failure',
    errorCode:           data.errorCode,
    errorMessage:        data.errorMessage,
    conversationId:      data.conversationId,
    threeDSHtmlContent:  data.threeDSHtmlContent,
  };
}

/** Adım 2: Banka callback'inden sonra ödemeyi tamamla */
export async function complete3DSPayment(
  config: IyzicoConfig,
  conversationId: string,
  paymentId: string,
): Promise<Iyzico3DSAuthResult> {
  const body = {
    locale:         'tr',
    conversationId,
    paymentId,
  };

  const randomKey = randomBytes(12).toString('hex');
  const response  = await fetch(`${config.baseUrl}/payment/3dsecure/auth`, {
    method:  'POST',
    headers: buildAuthHeader(config, randomKey, body),
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Iyzico 3DS auth HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    status:          string;
    errorCode?:      string;
    errorMessage?:   string;
    paymentId?:      string;
    conversationId?: string;
    paidPrice?:      string;
  };

  return {
    status:          data.status === 'success' ? 'success' : 'failure',
    errorCode:       data.errorCode,
    errorMessage:    data.errorMessage,
    paymentId:       data.paymentId,
    conversationId:  data.conversationId,
    paidPrice:       data.paidPrice,
  };
}

// ── Non-3DS (direkt kart) ─────────────────────────────────────────────────────
export async function createPayment(
  config: IyzicoConfig,
  request: IyzicoCreatePaymentRequest,
): Promise<IyzicoPaymentResult> {
  const body = {
    locale:         'tr',
    currency:       'TRY',
    installment:    1,
    paymentChannel: 'WEB',
    paymentGroup:   'PRODUCT',
    ...request,
  };

  const randomKey = randomBytes(12).toString('hex');
  const response  = await fetch(`${config.baseUrl}/payment/auth`, {
    method:  'POST',
    headers: buildAuthHeader(config, randomKey, body),
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Iyzico HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    status:           string;
    errorCode?:       string;
    errorMessage?:    string;
    paymentId?:       string;
    conversationId?:  string;
    paidPrice?:       string;
  };

  return {
    status:          data.status === 'success' ? 'success' : 'failure',
    errorCode:       data.errorCode,
    errorMessage:    data.errorMessage,
    paymentId:       data.paymentId,
    conversationId:  data.conversationId,
    paidPrice:       data.paidPrice,
  };
}
