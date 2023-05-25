import S, { ObjectSchema } from 'fluent-json-schema';
import { HttpException } from '../exceptions/exceptions';

export const Schemas = {
  exception: (...exceptions: Array<new () => HttpException>): ObjectSchema =>
    S.object()
      .description(
        'Available messages:\n\n' +
          exceptions.map((x) => `• ${(new x().body as { message: string }).message}`).join('\n\n'),
      )
      .prop('message', S.string().required())
      .prop('success', S.boolean().required()),
};
