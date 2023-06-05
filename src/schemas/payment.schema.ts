import S, { ObjectSchema } from 'fluent-json-schema';

export const PaymentSchema = {
  cardNumber: S.string().minLength(14).maxLength(19),
  expMonth: S.number().minimum(1).maximum(12),
  expYear: S.number().minimum(2023).maximum(9999),
  cvc: S.string().minLength(3).maxLength(4),
};

export const SubscribeRequestSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('cardNumber', PaymentSchema.cardNumber.required())
    .prop('expMonth', PaymentSchema.expMonth.required())
    .prop('expYear', PaymentSchema.expYear.required())
    .prop('cvc', PaymentSchema.cvc.required());
};

export const SubscribeResponseSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop(
      'subscription',
      S.object()
        .prop('id', S.string().required())
        .prop('status', S.string().required())
        .prop('current_period_start', S.number().required())
        .prop('current_period_end', S.number().required())
        .prop('collection_method', S.string().required())
        .prop('customer', S.string().required()),
    )
    .prop('success', S.boolean().required());
};

export const UnsubscribeResponseSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('message', S.string().required())
    .prop('success', S.boolean().required());
};
