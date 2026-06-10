import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt } from 'crypto';
import { VNPay, ProductCode, VnpLocale } from 'vnpay';

type Provider = 'VNPAY' | 'MOMO';

@Injectable()
export class PaymentGatewayService {
  constructor(private readonly config: ConfigService) {}

  private getVnpayInstance(): VNPay {
    const tmnCode = this.config.get<string>('VNP_TMN_CODE') || '';
    const hashSecret = this.config.get<string>('VNP_HASH_SECRET') || '';
    const vnpUrl = this.config.get<string>('VNP_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    
    let vnpayHost = 'https://sandbox.vnpayment.vn';
    try {
      const urlObj = new URL(vnpUrl);
      vnpayHost = urlObj.origin;
    } catch {}

    return new VNPay({
      tmnCode,
      secureSecret: hashSecret,
      vnpayHost,
    });
  }

  /**
   * Tạo paymentRef unique theo format: {PROVIDER}-{YYYYMMDDHHmmss}-{5 số ngẫu nhiên}
   */
  generatePaymentRef(provider: Provider): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14);
    const rand = randomInt(0, 99999).toString().padStart(5, '0');
    return `${provider}-${timestamp}-${rand}`;
  }

  /**
   * Build payment URL (VNPAY Sandbox or Local Mock)
   */
  buildPaymentUrl(
    provider: Provider,
    paymentRef: string,
    amount: string,
    returnUrl?: string,
  ): string {
    if (provider === 'VNPAY') {
      const vnpay = this.getVnpayInstance();
      const rawAmount = Number(amount.replace(/,/g, '').trim());
      const fallbackReturnUrl = this.config.get<string>('VNP_RETURN_URL') || 'http://localhost:3000/checkout/result';

      return vnpay.buildPaymentUrl({
        vnp_Amount: rawAmount,
        vnp_TxnRef: paymentRef,
        vnp_OrderInfo: `Thanh toan don hang ${paymentRef}`,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: returnUrl || fallbackReturnUrl,
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: VnpLocale.VN,
      });
    }

    const baseUrl = this.config
      .get<string>('MOCK_PAYMENT_BASE_URL', 'http://localhost:3000')
      .replace(/\/+$/, '');
    const params = new URLSearchParams({ provider, paymentRef });
    if (returnUrl) params.set('returnUrl', returnUrl);
    return `${baseUrl}/mock-payment?${params.toString()}`;
  }

  /**
   * Verify VNPAY signature from IPN/Webhook query parameters
   */
  verifyVnpaySignature(query: Record<string, string>): boolean {
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) return false;

    try {
      const vnpay = this.getVnpayInstance();
      const result = vnpay.verifyIpnCall(query as any);
      return result.isVerified;
    } catch {
      return false;
    }
  }

  /**
   * Verify HMAC-SHA256 signature từ webhook mock.
   * Signature = HMAC-SHA256(secret, "{provider}:{paymentRef}:{gatewayTransactionId}:{eventType}:{amount}:{currency}")
   */
  verifyWebhookSignature(
    provider: Provider,
    payload: {
      paymentRef: string;
      gatewayTransactionId: string;
      eventType: string;
      amount: number | string;
      currency?: string;
    },
    signature: string,
  ): boolean {
    const secret = this.getMockSecret(provider);
    const message = this.buildSignatureMessage(provider, payload);
    const expected = createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    return expected === signature;
  }

  /**
   * Throw nếu signature không hợp lệ.
   */
  assertValidSignature(
    provider: Provider,
    payload: {
      paymentRef: string;
      gatewayTransactionId: string;
      eventType: string;
      amount: number | string;
      currency?: string;
    },
    signature: string,
  ): void {
    if (!this.verifyWebhookSignature(provider, payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  /**
   * Tạo signature để FE/test có thể tự tạo mock webhook hợp lệ.
   * Chỉ expose trong development.
   */
  buildMockSignature(
    provider: Provider,
    payload: {
      paymentRef: string;
      gatewayTransactionId: string;
      eventType: string;
      amount: number | string;
      currency?: string;
    },
  ): string {
    const secret = this.getMockSecret(provider);
    const message = this.buildSignatureMessage(provider, payload);
    return createHmac('sha256', secret).update(message).digest('hex');
  }

  normalizeAmount(amount: number | string): string {
    const value =
      typeof amount === 'number'
        ? amount
        : Number(amount.replace(/,/g, '').trim());

    if (!Number.isFinite(value)) {
      return String(amount);
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  private buildSignatureMessage(
    provider: Provider,
    payload: {
      paymentRef: string;
      gatewayTransactionId: string;
      eventType: string;
      amount: number | string;
      currency?: string;
    },
  ): string {
    return [
      provider,
      payload.paymentRef,
      payload.gatewayTransactionId,
      payload.eventType,
      this.normalizeAmount(payload.amount),
      payload.currency ?? 'VND',
    ].join(':');
  }

  private getMockSecret(provider: Provider): string {
    const key =
      provider === 'VNPAY' ? 'MOCK_VNPAY_SECRET' : 'MOCK_MOMO_SECRET';
    return this.config.get<string>(key, 'mock-secret');
  }
}
