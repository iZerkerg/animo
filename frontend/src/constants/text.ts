import type { TimeOfDay } from "../services/api";

export const uiText = {
  brand: "Ánimo",
  nav: {
    diary: "Diario",
    calendar: "Calendario",
    charts: "Gráficos",
    profile: "Perfil",
    logout: "Salir"
  },
  auth: {
    headline: "Un diario emocional con mirada de dashboard.",
    subtitle: "Registra lo que sientes, descubre patrones y vuelve a ti con suavidad.",
    loginTab: "Entrar",
    registerTab: "Registro",
    name: "Nombre",
    email: "Correo",
    password: "Contraseña",
    loginAction: "Iniciar sesión",
    registerAction: "Crear cuenta",
    loginLoading: "Iniciando sesión...",
    registerLoading: "Creando cuenta...",
    forgotPassword: "¿Olvidaste tu contraseña?",
    forgotTitle: "Recuperar contraseña",
    forgotSubtitle: "Ingresa tu correo y te enviaremos un enlace para restablecerla.",
    forgotAction: "Enviar instrucciones",
    forgotLoading: "Enviando instrucciones...",
    backToLogin: "Volver a iniciar sesión",
    resetTitle: "Crear nueva contraseña",
    resetSubtitle: "Elige una contraseña nueva para tu cuenta.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    resetAction: "Actualizar contraseña",
    resetLoading: "Actualizando contraseña...",
    missingToken: "El enlace de recuperación no incluye un token válido.",
    passwordMismatch: "Las contraseñas no coinciden."
  },
  home: {
    greeting: "Hola",
    title: "¿Cómo se siente tu día?",
    quickMood: "Registrar ánimo",
    todaySummary: "Resumen de hoy",
    noEntriesToday: "Hoy todavía no registras tu ánimo.",
    noNote: "Sin nota",
    trends: "Tendencias",
    birthday: "¡Feliz cumpleaños, {name}! 🎂 Que tengas un día bonito."
  },
  profile: {
    title: "Tu perfil",
    subtitle: "Actualiza tus datos personales básicos.",
    avatarAlt: "Foto de perfil",
    addImage: "Agregar foto de perfil",
    changeImage: "Cambiar foto de perfil",
    optimizingImage: "Optimizando imagen...",
    uploadingImage: "Subiendo foto...",
    imageUploaded: "Foto de perfil actualizada.",
    imageInvalid: "Elige una imagen JPG, PNG o WEBP.",
    imageTooLarge: "La imagen sigue pesando más de 5 MB después de optimizarla.",
    birthDate: "Fecha de nacimiento",
    createdAt: "Cuenta creada",
    edit: "Editar perfil",
    editTitle: "Editar perfil",
    cancel: "Cancelar",
    save: "Guardar cambios",
    saving: "Guardando cambios...",
    saved: "Perfil actualizado.",
    logout: "Cerrar sesión"
  },
  moodForm: {
    title: "Registro rápido",
    selected: "Emociones seleccionadas",
    intensity: "Intensidad",
    chooseEmotion: "Elige al menos una emoción.",
    timeOfDay: "Momento",
    date: "Fecha",
    note: "Nota",
    notePlaceholder: "¿Qué pasó? ¿Qué necesitas recordar?",
    saving: "Guardando...",
    save: "Guardar registro"
  },
  calendar: {
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    noEntries: "No hay registros este día."
  },
  dashboard: {
    weeklyAverage: "Promedio semanal",
    monthlyAverage: "Promedio mensual",
    recentEvolution: "Evolución reciente",
    frequentEmotions: "Emociones frecuentes",
    timeOfDay: "Momento del día",
    emotionsByCategory: "Emociones por categoría"
  },
  reminders: {
    title: "Recordatorios",
    smtpWarning: "SMTP aún no está configurado. Puedes guardar horarios y probar el modo dry-run.",
    saved: "Recordatorios guardados.",
    testEmail: "Probar correo",
    save: "Guardar"
  },
  loading: "Preparando tu diario..."
} as const;

export const timeOfDayLabels: Record<TimeOfDay, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche"
};

export const emotions = [
  { emotion: "Feliz", emoji: "😊", score: 5 },
  { emotion: "Tranquila", emoji: "😌", score: 4 },
  { emotion: "Ansiosa", emoji: "😟", score: 2 },
  { emotion: "Triste", emoji: "😢", score: 1 },
  { emotion: "Enojada", emoji: "😠", score: 1 },
  { emotion: "Cansada", emoji: "😴", score: 2 },
  { emotion: "Motivada", emoji: "✨", score: 5 },
  { emotion: "Estresada", emoji: "😵", score: 2 }
] as const;
