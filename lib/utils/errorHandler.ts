const ERROR_MAP: [string, string][] = [
  ["Invalid login credentials", "E-posta veya şifre hatalı."],
  ["User already registered", "Bu e-posta adresi zaten kayıtlı."],
  ["Email not confirmed", "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin."],
  ["User not found", "Kullanıcı bulunamadı."],
  ["Password should be at least 6 characters", "Şifre en az 6 karakter olmalıdır."],
  ["Unable to validate email address: invalid format", "Geçersiz e-posta formatı."],
  ["Email rate limit exceeded", "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin."],
  ["For security purposes, you can only request this", "Güvenlik nedeniyle lütfen kısa bir süre bekleyin."],
  ["over_email_send_rate_limit", "Çok fazla e-posta isteği gönderildi. Lütfen bekleyin."],
  ["Auth session missing", "Oturum bulunamadı. Lütfen tekrar giriş yapın."],
  ["signup_disabled", "Kayıt sistemi şu an aktif değil."],
  ["New password should be different from the old", "Yeni şifre eski şifrenizden farklı olmalıdır."],
  ["Anonymous sign-ins are disabled", "Anonim giriş desteklenmiyor."],
  ["Network request failed", "İnternet bağlantınızı kontrol edin."],
  ["JWT expired", "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın."],
];

export function getErrorMessage(error: unknown): string {
  const message: string =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : typeof error === "string"
      ? error
      : "";
  for (const [key, tr] of ERROR_MAP) {
    if (message.includes(key)) return tr;
  }
  return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
}
