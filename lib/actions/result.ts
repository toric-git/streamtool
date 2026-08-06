import type { AppError, ErrorCode } from "@/lib/errors/catalog";
import { E } from "@/lib/errors/catalog";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code: ErrorCode };

export function actionOk<T = undefined>(data?: T): ActionResult<T> {
  return data === undefined ? { ok: true } : { ok: true, data };
}

export function actionFail(error: AppError): ActionResult<never> {
  return { ok: false, error: error.message, code: error.code };
}

/** requireRoomActor などの { error, code } 失敗形をそのまま ActionResult に。 */
export function actionFailFrom(failure: {
  error: string;
  code: ErrorCode;
}): ActionResult<never> {
  return { ok: false, error: failure.error, code: failure.code };
}

export function unknownFail(message?: string): ActionResult<never> {
  return actionFail(
    message ? { code: E.UNKNOWN.code, message } : E.UNKNOWN,
  );
}
