import type { User } from "../types";

/**
 * Проверка готовности пользователя к оформлению аренды.
 *
 * Бизнес-правила (синхронизированы с backend assertUserCanRent):
 *   1. У пользователя должен быть привязан номер телефона.
 *   2. Статус верификации документов должен быть `approved`.
 *
 * Если хотя бы одно условие не выполнено — аренда запрещена,
 * вызывающий код должен показать пользователю понятное сообщение
 * с указанием, что именно нужно исправить.
 */
export type RentalBlockReason = "no_phone" | "not_verified";

export interface RentalReadiness {
  canRent: boolean;
  reasons: RentalBlockReason[];
  /** Готовое сообщение для отображения в alert / toast. */
  message: string;
  /** Заголовок (для alert dialog). */
  title: string;
}

const TITLE = "Аренда недоступна";

export function checkRentalReadiness(
  profile?: User | null,
): RentalReadiness {
  if (!profile) {
    return {
      canRent: false,
      reasons: [],
      title: TITLE,
      message:
        "Профиль ещё загружается. Подождите несколько секунд и попробуйте снова.",
    };
  }

  const reasons: RentalBlockReason[] = [];
  if (!profile.phoneNumber || profile.phoneNumber.trim() === "") {
    reasons.push("no_phone");
  }
  if (profile.verificationStatus !== "approved") {
    reasons.push("not_verified");
  }

  if (reasons.length === 0) {
    return { canRent: true, reasons: [], title: "", message: "" };
  }

  let message: string;
  if (reasons.length === 2) {
    message =
      "Перед арендой необходимо:\n" +
      "1) Привязать номер телефона в профиле.\n" +
      "2) Пройти верификацию документов.\n\n" +
      "Откройте профиль и выполните оба шага.";
  } else if (reasons[0] === "no_phone") {
    message =
      "Перед арендой необходимо привязать номер телефона.\n\n" +
      "Откройте профиль и нажмите «Привязать номер».";
  } else {
    // not_verified
    const status = profile.verificationStatus;
    if (status === "pending") {
      message =
        "Ваша заявка на верификацию ожидает проверки оператором.\n" +
        "Аренда будет доступна после её одобрения.";
    } else if (status === "rejected") {
      message =
        "Ваша заявка на верификацию была отклонена.\n" +
        "Откройте раздел «Верификация» в профиле и загрузите документы повторно.";
    } else {
      message =
        "Перед арендой необходимо пройти верификацию документов.\n\n" +
        "Откройте профиль и выполните верификацию.";
    }
  }

  return { canRent: false, reasons, title: TITLE, message };
}

/**
 * Разбирает ответ backend (403 от endpoint /api/rentals/start) и
 * формирует то же сообщение, что показывается в локальном checkRentalReadiness.
 * Используется в качестве защитной сети — если backend заблокировал аренду,
 * а локально проверка прошла (например, profile был устаревший в кэше).
 */
export function parseBackendRentalBlock(
  responseData: unknown,
): { message: string; reasons: RentalBlockReason[] } | null {
  if (!responseData || typeof responseData !== "object") return null;
  const d = responseData as {
    error?: string;
    message?: string;
    reasons?: RentalBlockReason[];
  };
  if (d.error !== "RENTAL_BLOCKED") return null;
  return {
    message: d.message || "Аренда недоступна.",
    reasons: Array.isArray(d.reasons) ? d.reasons : [],
  };
}
