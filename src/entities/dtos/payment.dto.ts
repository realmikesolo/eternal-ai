interface Card {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface SubscribeDto extends Card {}

export interface SubscribeWebhookDto {
  body: string | Buffer;
  signature: string | Buffer | string[];
}

export interface UnsubscribeDto {
  id: string;
}

export interface ChangePaymentMethodDto extends Card {}
