import { toast } from "react-fox-toast";

const IDENTITY_ERROR_MAP: Record<string, string> = {
  InvalidUserName: "Ім'я користувача містить неприпустимі символи.",
  DuplicateUserName: "Користувач з таким іменем вже існує.",
  DuplicateEmail: "Ця електронна адреса вже використовується.",
  PasswordTooShort: "Пароль має містити щонайменше 8 символів.",
  PasswordRequiresNonAlphanumeric: "Пароль має містити хоча б один спецсимвол (наприклад, !, @, #, $, %).",
  PasswordRequiresDigit: "Пароль має містити хоча б одну цифру (0-9).",
  PasswordRequiresLower: "Пароль має містити хоча б одну малу латинську літеру (a-z).",
  PasswordRequiresUpper: "Пароль має містити хоча б одну велику латинську літеру (A-Z).",
  PasswordRequiresUniqueChars: "Пароль має містити більше унікальних символів.",
  UserAlreadyInRole: "Користувач вже має цю роль.",
  UserNotInRole: "Користувач не має цієї ролі.",
};

const COMMON_MESSAGE_MAP: Record<string, string> = {
  "Invalid username!": "Користувача з таким іменем не знайдено.",
  "Username not found and/or password incorrect!": "Невірне ім'я користувача або пароль.",
  "Username is already taken.": "Це ім'я користувача вже зайнято.",
  "Email is already in use.": "Ця електронна адреса вже використовується.",
};

/**
 * Extracts a user-friendly error message from an Axios error or generic error object.
 */
export function getApiErrorMessage(
  err: any,
  fallbackMessage = "Сталася неочікувана помилка. Спробуйте пізніше."
): string {
  if (!err) return fallbackMessage;

  // 1. Check network/connection error
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return "Помилка зв'язку з сервером. Перевірте з'єднання з інтернетом.";
  }

  const response = err.response;
  if (!response) {
    return err.message || fallbackMessage;
  }

  const data = response.data;

  // 2. Response data is a string
  if (typeof data === "string" && data.trim()) {
    return COMMON_MESSAGE_MAP[data.trim()] || data.trim();
  }

  // 3. Response data is an array (e.g. IdentityErrors: [{ code, description }])
  if (Array.isArray(data) && data.length > 0) {
    const messages = data.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if (item.code && IDENTITY_ERROR_MAP[item.code]) {
          return IDENTITY_ERROR_MAP[item.code];
        }
        return item.description || item.message || JSON.stringify(item);
      }
      return String(item);
    });
    return messages.filter(Boolean).join("\n") || fallbackMessage;
  }

  // 4. Response data is an object
  if (data && typeof data === "object") {
    // Check custom message / ban message
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }

    // Check ModelState / ProblemDetails validation errors: { errors: { Field: ["error1", "error2"] } }
    if (data.errors && typeof data.errors === "object") {
      const errorList: string[] = [];
      for (const field of Object.keys(data.errors)) {
        const fieldErrors = data.errors[field];
        if (Array.isArray(fieldErrors)) {
          errorList.push(...fieldErrors);
        } else if (typeof fieldErrors === "string") {
          errorList.push(fieldErrors);
        }
      }
      if (errorList.length > 0) {
        return errorList.join("\n");
      }
    }

    if (typeof data.title === "string" && data.title.trim()) {
      return data.title.trim();
    }
  }

  // 5. Fallback based on HTTP status codes
  switch (response.status) {
    case 400:
      return "Некоректні дані запиту. Перевірте введені значення.";
    case 401:
      return "Невірне ім'я користувача або пароль.";
    case 403:
      return "Доступ заборонено.";
    case 404:
      return "Запитуваний ресурс не знайдено.";
    case 409:
      return "Конфлікт даних. Такий запис уже існує.";
    case 429:
      return "Забагато запитів. Зачекайте хвилину і спробуйте знову.";
    case 500:
      return "Помилка сервера. Спробуйте пізніше.";
    default:
      return fallbackMessage;
  }
}

/**
 * Displays a toast notification with the extracted API error message.
 */
export function showApiError(
  err: any,
  fallbackMessage = "Сталася помилка. Перевірте дані та спробуйте ще раз."
): void {
  const message = getApiErrorMessage(err, fallbackMessage);
  toast.error(message, {
    isCloseBtn: true,
  });
}
