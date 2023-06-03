export interface SubscribeDto {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface SubscribeWebhookDto {
  body: string | Buffer;
  signature: string | Buffer | string[];
}
