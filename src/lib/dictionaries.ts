import type { Lang } from "@/lib/i18n";

// One dictionary per surface. The `en` shape is the source of truth; `es`
// must match it exactly (enforced by the Dict type below).

const en = {
  home: {
    tagline: "Miami — Grooming Standard",
    heroA: "The standard isn't communicated.",
    heroB: "It's executed.",
    blurb:
      "Curated barbershops and verified at-home barbers. Your style on file, booked and paid in minutes.",
    ctaBook: "Book your cut",
    ctaBarber: "I'm a barber",
    doors: {
      clients: {
        label: "For clients",
        title: "Sit down already understood",
        blurb:
          "Every shop is approved before it appears. Four photos of your style travel with every booking — the barber knows the work before you're in the chair.",
        cta: "Find your shop",
      },
      barbers: {
        label: "For barbers",
        title: "A profile that works for you",
        blurb:
          "Certifications verified by The Guild. A track record counted from completed bookings. Clients book you — at the shop or at their home.",
        cta: "Join The Guild",
      },
      brands: {
        label: "For brands",
        title: "Grooming at your event",
        blurb:
          "The Guild runs the chairs at your activation — QR registration, real headcounts, professional barbers.",
        cta: "Talk to us",
      },
    },
    how: {
      title: "How it works",
      s1: {
        title: "Your style on file",
        blurb: "Four photos — front, sides, back. Updated when your style changes.",
      },
      s2: {
        title: "Book and pay upfront",
        blurb: "Pick the shop, the service, the time. One secure payment. Done.",
      },
      s3: {
        title: "Arrive expected",
        blurb: "The barber already knows your cut. Nothing to explain from the chair.",
      },
    },
    filter: {
      line: "The Guild is not for everyone.",
      sub: "It's for those who are at the level.",
    },
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    partners: "Events for brands",
  },
  nav: {
    home: "Home",
    shops: "Shops",
    barbers: "Barbers",
    bookings: "Bookings",
    profile: "Profile",
    myShop: "My shop",
    myBarber: "My profile",
    myEvents: "My events",
    events: "Events",
    admin: "Admin",
  },
  welcome: {
    eyebrow: "Welcome to The Guild",
    title: "Choose your path.",
    person: {
      label: "For clients",
      title: "I'm here for the cut",
      blurb:
        "Book curated barbershops and verified at-home barbers. Your style stays on file.",
      cta: "Set up my profile",
    },
    barber: {
      label: "For barbers",
      title: "I'm a barber",
      blurb:
        "Build your professional profile — certifications, track record, bookings at the shop or at home.",
      cta: "Create my barber profile",
    },
    business: {
      label: "For brands",
      title: "We're a brand",
      blurb: "Grooming activations for your events — QR registration, real headcounts.",
      cta: "Talk to our team",
    },
    signOut: "Sign out",
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
    console: {
      client: {
        heading: "Your next cut",
        noUpcoming: "No upcoming appointments.",
        bookCta: "Book your next cut →",
        premiumBadge: "Premium member",
      },
      shopOwner: {
        heading: "Shop console",
        status: "Shop status",
        noShop: "No shop yet",
        upcoming: "Upcoming bookings",
        services: "Services",
        staff: "Staff",
      },
      barber: {
        heading: "Barber console",
        status: "Profile status",
        noProfile: "No barber profile yet",
        upcoming: "Upcoming bookings",
        services: "Services",
        certifications: "Certifications",
      },
      eventManager: {
        heading: "Events console",
        liveEvents: "Live events",
        totalEvents: "Total events",
        registrations: "Registrations",
      },
      admin: {
        heading: "Admin console",
        pendingShops: "Shops pending",
        pendingBarbers: "Barbers pending",
        newLeads: "New B2B leads",
      },
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
    tagline: "Miami — Grooming Standard",
    heroA: "El estándar no se comunica.",
    heroB: "Se ejecuta.",
    blurb:
      "Barberías curadas y barberos a domicilio verificados. Tu estilo en archivo, reservado y pagado en minutos.",
    ctaBook: "Reserva tu corte",
    ctaBarber: "Soy barbero",
    doors: {
      clients: {
        label: "Para clientes",
        title: "Siéntate ya entendido",
        blurb:
          "Cada barbería se aprueba antes de aparecer. Cuatro fotos de tu estilo viajan con cada reserva — el barbero conoce el trabajo antes de que llegues a la silla.",
        cta: "Encuentra tu barbería",
      },
      barbers: {
        label: "Para barberos",
        title: "Un perfil que trabaja para ti",
        blurb:
          "Certificaciones verificadas por The Guild. Historial contado desde reservas completadas. Los clientes te reservan — en la barbería o en su casa.",
        cta: "Únete a The Guild",
      },
      brands: {
        label: "Para marcas",
        title: "Grooming en tu evento",
        blurb:
          "The Guild opera las sillas de tu activación — registro por QR, asistencia real, barberos profesionales.",
        cta: "Hablemos",
      },
    },
    how: {
      title: "Cómo funciona",
      s1: {
        title: "Tu estilo en archivo",
        blurb: "Cuatro fotos — frente, lados, atrás. Se actualizan cuando cambias de estilo.",
      },
      s2: {
        title: "Reserva y paga por adelantado",
        blurb: "Elige la barbería, el servicio, la hora. Un pago seguro. Listo.",
      },
      s3: {
        title: "Llega esperado",
        blurb: "El barbero ya conoce tu corte. Nada que explicar desde la silla.",
      },
    },
    filter: {
      line: "The Guild no es para todos.",
      sub: "Es para quienes están a la altura.",
    },
    terms: "Términos y Condiciones",
    privacy: "Política de Privacidad",
    partners: "Eventos para marcas",
  },
  nav: {
    home: "Inicio",
    shops: "Barberías",
    barbers: "Barberos",
    bookings: "Reservas",
    profile: "Perfil",
    myShop: "Mi barbería",
    myBarber: "Mi perfil",
    myEvents: "Mis eventos",
    events: "Eventos",
    admin: "Admin",
  },
  welcome: {
    eyebrow: "Bienvenido a The Guild",
    title: "Elige tu camino.",
    person: {
      label: "Para clientes",
      title: "Vengo por el corte",
      blurb:
        "Reserva barberías curadas y barberos a domicilio verificados. Tu estilo queda en archivo.",
      cta: "Configurar mi perfil",
    },
    barber: {
      label: "Para barberos",
      title: "Soy barbero",
      blurb:
        "Construye tu perfil profesional — certificaciones, historial, reservas en barbería o a domicilio.",
      cta: "Crear mi perfil de barbero",
    },
    business: {
      label: "Para marcas",
      title: "Somos una marca",
      blurb: "Activaciones de grooming para tus eventos — registro por QR, asistencia real.",
      cta: "Hablar con el equipo",
    },
    signOut: "Cerrar sesión",
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
    console: {
      client: {
        heading: "Tu próximo corte",
        noUpcoming: "No tienes citas próximas.",
        bookCta: "Reserva tu próximo corte →",
        premiumBadge: "Miembro premium",
      },
      shopOwner: {
        heading: "Consola de barbería",
        status: "Estado de la barbería",
        noShop: "Aún sin barbería",
        upcoming: "Reservas próximas",
        services: "Servicios",
        staff: "Equipo",
      },
      barber: {
        heading: "Consola de barbero",
        status: "Estado del perfil",
        noProfile: "Aún sin perfil de barbero",
        upcoming: "Reservas próximas",
        services: "Servicios",
        certifications: "Certificaciones",
      },
      eventManager: {
        heading: "Consola de eventos",
        liveEvents: "Eventos en vivo",
        totalEvents: "Eventos totales",
        registrations: "Registros",
      },
      admin: {
        heading: "Consola de admin",
        pendingShops: "Barberías pendientes",
        pendingBarbers: "Barberos pendientes",
        newLeads: "Prospectos B2B nuevos",
      },
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
