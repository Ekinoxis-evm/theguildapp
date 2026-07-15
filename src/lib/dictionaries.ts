import type { Lang } from "@/lib/i18n";

// One dictionary per surface. The `en` shape is the source of truth; `es`
// must match it exactly (enforced by the Dict type below).

const en = {
  home: {
    tagline: "Grooming Standard",
    blurb:
      "Premium barbershops and private barbers. Book your next cut, keep your style on file, arrive game-ready.",
    cta: "Sign in / Join",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
  },
  dashboard: {
    welcome: "Welcome",
    signedInAs: "Signed in as",
    finishProfileTitle: "Finish setting up your profile",
    finishProfileBlurb:
      "Add your contact info, profile photo, and four photos of your current style so barbers know exactly what you want.",
    finishProfileCta: "Set up my profile",
    signOut: "Sign out",
    sections: {
      shops: { title: "Barbershops", blurb: "Find a shop and book your next cut." },
      barbers: { title: "Barbers", blurb: "Professional profiles · at-home grooming (premium)." },
      bookings: { title: "Bookings", blurb: "Upcoming and past appointments." },
      events: { title: "Events", blurb: "Guild activations you've joined." },
      profile: { title: "Profile", blurb: "Personal info and My Style photos." },
      myBarber: { title: "My barber profile", blurb: "Your services, certifications, and bookings." },
      myEvents: { title: "My events", blurb: "Create activations and track registrations." },
      myShop: { title: "My shop", blurb: "Manage your barbershop." },
      myShopStaff: { title: "My shop", blurb: "Your shop's bookings." },
      listShop: { title: "List your barbershop", blurb: "Own a shop? Apply to join The Guild." },
      admin: { title: "Admin", blurb: "Approvals, verifications, and leads." },
      premium: { title: "Premium", blurb: "The barbershop comes to you — $19.99/month." },
    },
  },
  premium: {
    title: "Guild",
    titleAccent: "Premium",
    tagline: "The barbershop comes to you.",
    perks: [
      "At-home service: book approved private barbers to come to you",
      "Your exact address is stored securely and shared only with your booked barber",
      "Cancel anytime — premium stays active until the end of the billing period",
    ],
    paymentReceived:
      "Payment received — your premium access activates in a few seconds. Refresh this page.",
    checkoutError: "Checkout could not be started. Please try again.",
    youArePremium: "You're premium.",
    subscriptionStatus: "Subscription status:",
    manage: "Manage subscription",
    manageBlurb:
      "Update your payment method, view invoices, or cancel — handled securely by Stripe.",
    grantedByTeam: "Your premium access was granted by The Guild team.",
    browseBarbers: "Browse private barbers →",
    perMonth: "/month",
    upgrade: "Upgrade to Premium",
    secureCheckout: "Secure checkout via Stripe. Cancel anytime.",
    backToDashboard: "← Dashboard",
  },
} as const;

type DeepStringShape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? readonly string[]
      : DeepStringShape<T[K]>;
};
export type Dict = DeepStringShape<typeof en>;

const es: Dict = {
  home: {
    tagline: "Grooming Standard",
    blurb:
      "Barberías premium y barberos privados. Reserva tu próximo corte, guarda tu estilo y llega listo para el juego.",
    cta: "Inicia sesión / Únete",
    terms: "Términos y Condiciones",
    privacy: "Política de Privacidad",
  },
  dashboard: {
    welcome: "Bienvenido",
    signedInAs: "Sesión iniciada como",
    finishProfileTitle: "Termina de configurar tu perfil",
    finishProfileBlurb:
      "Agrega tus datos de contacto, foto de perfil y cuatro fotos de tu estilo actual para que los barberos sepan exactamente lo que quieres.",
    finishProfileCta: "Configurar mi perfil",
    signOut: "Cerrar sesión",
    sections: {
      shops: { title: "Barberías", blurb: "Encuentra una barbería y reserva tu próximo corte." },
      barbers: { title: "Barberos", blurb: "Perfiles profesionales · servicio a domicilio (premium)." },
      bookings: { title: "Reservas", blurb: "Citas próximas y pasadas." },
      events: { title: "Eventos", blurb: "Activaciones de The Guild en las que participas." },
      profile: { title: "Perfil", blurb: "Datos personales y fotos de Mi Estilo." },
      myBarber: { title: "Mi perfil de barbero", blurb: "Tus servicios, certificaciones y reservas." },
      myEvents: { title: "Mis eventos", blurb: "Crea activaciones y controla los registros." },
      myShop: { title: "Mi barbería", blurb: "Administra tu barbería." },
      myShopStaff: { title: "Mi barbería", blurb: "Las reservas de tu barbería." },
      listShop: { title: "Registra tu barbería", blurb: "¿Tienes una barbería? Únete a The Guild." },
      admin: { title: "Admin", blurb: "Aprobaciones, verificaciones y prospectos." },
      premium: { title: "Premium", blurb: "La barbería va a ti — $19.99/mes." },
    },
  },
  premium: {
    title: "Guild",
    titleAccent: "Premium",
    tagline: "La barbería va a ti.",
    perks: [
      "Servicio a domicilio: reserva barberos privados aprobados que van a ti",
      "Tu dirección exacta se guarda de forma segura y solo se comparte con tu barbero reservado",
      "Cancela cuando quieras — premium sigue activo hasta el final del período facturado",
    ],
    paymentReceived:
      "Pago recibido — tu acceso premium se activa en unos segundos. Actualiza esta página.",
    checkoutError: "No se pudo iniciar el pago. Inténtalo de nuevo.",
    youArePremium: "Eres premium.",
    subscriptionStatus: "Estado de la suscripción:",
    manage: "Administrar suscripción",
    manageBlurb:
      "Actualiza tu método de pago, revisa facturas o cancela — gestionado de forma segura por Stripe.",
    grantedByTeam: "Tu acceso premium fue otorgado por el equipo de The Guild.",
    browseBarbers: "Ver barberos privados →",
    perMonth: "/mes",
    upgrade: "Mejorar a Premium",
    secureCheckout: "Pago seguro vía Stripe. Cancela cuando quieras.",
    backToDashboard: "← Panel",
  },
};

const DICTS: Record<Lang, Dict> = { en, es };

export function dict(lang: Lang): Dict {
  return DICTS[lang];
}
