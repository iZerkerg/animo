import type { TimeOfDay } from "../services/api";

export const uiText = {
  brand: "Ánimo",
  nav: {
    diary: "Diario",
    calendar: "Calendario",
    newMood: "Registrar",
    charts: "Análisis",
    achievements: "Logros",
    profile: "Perfil",
    settings: "Configuración",
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
    title: "¿Cómo te sientes hoy?",
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
    settings: "Configuración",
    achievements: "Logros",
    cancel: "Cancelar",
    save: "Guardar cambios",
    saving: "Guardando cambios...",
    saved: "Perfil actualizado.",
    logout: "Cerrar sesión"
  },
  settings: {
    title: "Configuración",
    subtitle: "Ajusta cómo se ve y se siente tu diario.",
    visual: "Visual",
    themes: "Temas",
    themesDescription: "Elige la paleta que acompaña tu espacio.",
    appearance: "Modo oscuro",
    appearanceDescription: "Define si la app usa claro, oscuro o sigue tu sistema.",
    backToProfile: "Volver al perfil",
    colorThemes: {
      rose: "Rosa",
      red: "Rojo",
      blue: "Azul",
      green: "Verde",
      sun: "Sol"
    }
  },
  achievements: {
    title: "Logros"
  },
  moodForm: {
    title: "Registro rápido",
    subtitle: "Elige cómo te sientes, ajusta la intensidad y guarda este momento.",
    selected: "Emociones seleccionadas",
    intensity: "Intensidad",
    chooseEmotion: "Elige al menos una emoción.",
    timeOfDay: "Momento",
    date: "Fecha",
    note: "Nota",
    notePlaceholder: "¿Qué pasó? ¿Qué necesitas recordar?",
    saving: "Guardando...",
    save: "Guardar registro",
    saved: "Registro guardado."
  },
  calendar: {
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    noEntries: "No hay registros para este día.",
    noCategories: "Sin categorías"
  },
  dashboard: {
    title: "Análisis",
    period: "Periodo de análisis",
    timeRange: "Temporalidad",
    viewing: "Estás viendo: {period}",
    startDate: "Fecha inicio",
    endDate: "Fecha fin",
    invalidRange: "La fecha de inicio no puede ser posterior a la fecha fin.",
    recordAnalyzed: "registro analizado",
    recordsAnalyzed: "registros analizados",
    emotionAnalyzed: "emoción analizada",
    emotionsAnalyzed: "emociones analizadas",
    emotionalBalance: "Balance emocional",
    emotionalBalanceNegative: "Negativo",
    emotionalBalanceNeutral: "Equilibrio",
    emotionalBalancePositive: "Positivo",
    emotionalBalanceNoData: "No hay emociones suficientes para calcular el balance en este período.",
    topEmotion: "Emoción más frecuente",
    moodTrend: "Evolución del estado de ánimo",
    moodTrendHint: "Este gráfico resume si en cada día predominaron emociones positivas o negativas, considerando la intensidad de cada emoción.",
    moodTrendScaleHint: "0 representa equilibrio. Valores positivos indican predominio de emociones positivas y valores negativos predominio de emociones negativas.",
    recentEvolution: "Evolución reciente",
    frequentEmotions: "Emociones frecuentes",
    frequencyHint: "Cada emoción seleccionada cuenta como una ocurrencia.",
    emotionalBalanceTooltip: "Este indicador resume el predominio de emociones positivas y negativas registradas durante el período seleccionado, considerando también la intensidad de cada emoción.",
    noFrequencyData: "No hay emociones registradas en este periodo.",
    singleDayEvolutionHint: "Para ver una tendencia, selecciona un periodo de varios días o registra más momentos del día.",
    notEnoughEvolutionData: "No hay registros suficientes para este periodo. Prueba seleccionando una temporalidad más amplia.",
    noDataForDay: "Sin registros ese día",
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
