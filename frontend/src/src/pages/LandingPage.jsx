import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../auth/apiClient';
import { getToken } from '../auth/authStorage';
import { logoutTenantSession } from '../auth/logoutSession';
import { ClienteLoginPanel } from '../components/ClienteLoginPanel';
import { ThemeToggle } from '../theme/ThemeToggle';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const NAV_LINKS = [
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#destacados', label: 'Servicios' },
    { href: '#carta', label: 'Carta digital' },
    { href: '#novedades', label: 'Novedades' },
    { href: '#contacto', label: 'Contáctanos' },
];

/** Enlaces del pie: feedback claro en tema claro (hover, foco, active). */
const footerInteractiveLinkClass = classNames(
    'block w-full sm:w-auto rounded-lg px-2 py-2 -mx-2 text-left transition-colors duration-150',
    'text-stone-700 dark:text-stone-300',
    'hover:bg-stone-200 hover:text-stone-900 hover:underline hover:underline-offset-[3px] decoration-amber-700/70',
    'dark:hover:bg-white/10 dark:hover:text-white dark:hover:decoration-amber-400/90',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
    'focus-visible:bg-stone-200/70 focus-visible:text-stone-900 focus-visible:underline',
    'focus-visible:ring-offset-stone-100 dark:focus-visible:ring-offset-stone-900 dark:focus-visible:bg-white/10 dark:focus-visible:text-white',
    'active:bg-stone-300/80 dark:active:bg-white/15',
);

const DESTACADOS = [
    {
        title: 'Carta menú',
        desc: 'Consulta platos, bebidas y combos en tiempo real.',
        href: '#login-esquina',
        accent: 'from-amber-500/25 to-orange-600/20',
    },
    {
        title: 'Tu cuenta cliente',
        desc: 'Guarda tu sesión y accede siempre al menú actualizado.',
        href: '#login-esquina',
        accent: 'from-yellow-500/20 to-amber-600/15',
    },
    {
        title: 'Ambiente familiar',
        desc: 'Tradición y calidez para compartir en mesa.',
        href: '#nosotros',
        accent: 'from-stone-400/25 to-stone-600/15',
    },
    {
        title: 'Pedidos claros',
        desc: 'Precios visibles y categorías ordenadas.',
        href: '#carta',
        accent: 'from-orange-500/20 to-red-900/10',
    },
    {
        title: '¿Tienes un evento?',
        desc: 'Contáctanos para cotizar espacios y menús especiales.',
        href: '#contacto',
        accent: 'from-amber-700/20 to-neutral-900/20',
    },
];

const DESTACADOS_BG_IMAGES = [
    '/comidas carrousel.jpg',
    '/evento de familia carrousel.jpeg',
    '/familia carrousel.jpg',
    '/mesero.jpeg',
];

const DESTACADOS_BG_MASK = {
    WebkitMaskImage:
        'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%), linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
    WebkitMaskComposite: 'source-in',
    maskImage:
        'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%), linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
    maskComposite: 'intersect',
};

function DestacadosBackgroundCarousel({ activeIndex }) {
    return (
        <div
            className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-3/4 lg:w-2/3 overflow-hidden transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
                ...DESTACADOS_BG_MASK,
                transformOrigin: 'right center',
            }}
            aria-hidden
        >
            <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {DESTACADOS_BG_IMAGES.map((src) => (
                    <div
                        key={src}
                        className="min-w-full w-full h-full shrink-0 bg-cover bg-no-repeat"
                        style={{
                            backgroundImage: `url('${src}')`,
                            backgroundPosition: 'right center',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TarjetaServicioDestacado({ item, className }) {
    const cardCls = classNames(
        'group relative rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-neutral-950/50 overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-300/40 dark:hover:border-amber-500/30 transition-all min-h-[340px] sm:min-h-[380px] flex flex-col',
        className,
    );

    const inner = (
        <>
            <div className={classNames('h-40 sm:h-48 bg-gradient-to-br shrink-0', item.accent)} />
            <div className="p-6 sm:p-7 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-neutral-50 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">{item.title}</h3>
                <p className="mt-3 text-base text-stone-600 dark:text-neutral-400 leading-relaxed flex-1">{item.desc}</p>
                <span className="mt-5 text-sm font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                    Ver más <span aria-hidden>→</span>
                </span>
            </div>
        </>
    );

    if (item.href.startsWith('/')) {
        return (
            <Link to={item.href} className={cardCls}>
                {inner}
            </Link>
        );
    }

    return (
        <a href={item.href} className={cardCls}>
            {inner}
        </a>
    );
}

function CarruselServicios({ items }) {
    const trackRef = useRef(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const updateBtns = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanPrev(el.scrollLeft > 4);
        setCanNext(el.scrollLeft < maxScroll - 4);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updateBtns();
        el.addEventListener('scroll', updateBtns, { passive: true });
        window.addEventListener('resize', updateBtns);
        return () => {
            el.removeEventListener('scroll', updateBtns);
            window.removeEventListener('resize', updateBtns);
        };
    }, [updateBtns]);

    function scrollByDir(dir) {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector('[data-carousel-card]');
        const step = card ? card.clientWidth + 16 : el.clientWidth * 0.8;
        el.scrollBy({ left: dir * step, behavior: 'smooth' });
    }

    return (
        <div className="relative">
            <div
                ref={trackRef}
                className="flex gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item) => (
                    <TarjetaServicioDestacado
                        key={item.title}
                        item={item}
                        className="snap-start shrink-0 basis-[85%] sm:basis-[55%] lg:basis-[40%] xl:basis-[30%]"
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={() => scrollByDir(-1)}
                disabled={!canPrev}
                aria-label="Anterior"
                className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-stone-200 dark:border-white/15 bg-white/90 dark:bg-neutral-900/90 text-stone-800 dark:text-neutral-100 shadow-md hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                type="button"
                onClick={() => scrollByDir(1)}
                disabled={!canNext}
                aria-label="Siguiente"
                className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-stone-200 dark:border-white/15 bg-white/90 dark:bg-neutral-900/90 text-stone-800 dark:text-neutral-100 shadow-md hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

const NOVEDADES = [
    {
        fecha: '12 May 2026',
        titulo: 'Nuevo brunch de fin de semana',
        texto:
            'Los sábados y domingos sumamos opciones para compartir: combos sweet & savory y jugos naturales. Te esperamos desde las 9:00.',
    },
    {
        fecha: '28 Abr 2026',
        titulo: 'Menú digital renovado',
        texto:
            'La carta en la web se puede explorar sin iniciar sesión; al entrar también puedes usar reservas y el resto del área cliente.',
    },
    {
        fecha: '15 Abr 2026',
        titulo: 'Ingredientes de temporada',
        texto:
            'Incorporamos productos locales según temporada: pregúntanos por los platos destacados del mes en sala.',
    },
];

const DESTACADOS_BG_INTERVAL_MS = 1500;

export function LandingPage() {
    const [sesionCliente, setSesionCliente] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [loginEsquinaAbierto, setLoginEsquinaAbierto] = useState(false);
    const [destacadosBgHover, setDestacadosBgHover] = useState(false);
    const [destacadosBgIndex, setDestacadosBgIndex] = useState(0);

    const destacadosLista = useMemo(
        () => [
            {
                title: 'Reserva de mesa',
                desc: sesionCliente
                    ? 'Solicita día, hora y mesa. El restaurante revisará tu solicitud.'
                    : 'Disponible con tu cuenta cliente: inicia sesión para reservar.',
                href: sesionCliente ? '/cliente/reservas' : '#login-esquina',
                accent: 'from-teal-500/25 to-cyan-700/15',
            },
            ...DESTACADOS,
        ],
        [sesionCliente],
    );

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setSesionCliente(false);
            return;
        }

        let cancelled = false;
        apiFetch('/api/auth/me')
            .then((data) => {
                if (cancelled) return;
                setSesionCliente(data?.user?.rol === 'CLIENTE');
            })
            .catch(() => {
                if (cancelled) return;
                setSesionCliente(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!destacadosBgHover) {
            setDestacadosBgIndex(0);
            return;
        }

        const id = window.setInterval(() => {
            setDestacadosBgIndex((i) => (i + 1) % DESTACADOS_BG_IMAGES.length);
        }, DESTACADOS_BG_INTERVAL_MS);

        return () => window.clearInterval(id);
    }, [destacadosBgHover]);

    useEffect(() => {
        function syncLoginHash() {
            const raw = window.location.hash.replace(/^#/, '');
            if (raw === 'acceso' || raw === 'login-esquina') {
                setLoginEsquinaAbierto(true);
            }
        }
        syncLoginHash();
        window.addEventListener('hashchange', syncLoginHash);
        return () => window.removeEventListener('hashchange', syncLoginHash);
    }, []);

    useEffect(() => {
        function onResize() {
            if (window.matchMedia('(min-width: 1024px)').matches) setMobileNavOpen(false);
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!loginEsquinaAbierto || sesionCliente) return;
        const id = window.requestAnimationFrame(() => {
            document.getElementById('login-esquina')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
        return () => window.cancelAnimationFrame(id);
    }, [loginEsquinaAbierto, sesionCliente]);

    function closeMobileNav() {
        setMobileNavOpen(false);
    }

    function abrirLoginEsquina() {
        setLoginEsquinaAbierto(true);
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#login-esquina`);
    }

    function cerrarLoginEsquina() {
        setLoginEsquinaAbierto(false);
        if (window.location.hash === '#login-esquina' || window.location.hash === '#carta') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
    }

    async function cerrarSesionCliente() {
        await logoutTenantSession();
        setSesionCliente(false);
        cerrarLoginEsquina();
        closeMobileNav();
    }

    const fabVerCartaClass = classNames(
        'group flex items-center gap-2 rounded-full touch-manipulation',
        'pl-3 pr-3.5 py-3 min-[400px]:pl-4 min-[400px]:pr-5 sm:gap-2.5 sm:py-3.5 md:py-4',
        'bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-950 font-semibold text-xs min-[400px]:text-sm sm:text-base',
        'shadow-[0_8px_30px_rgba(245,158,11,0.45)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        'ring-2 min-[400px]:ring-4 ring-white/90 dark:ring-neutral-950/90 hover:brightness-105 active:scale-[0.98] transition-all',
        'focus-visible:outline-none focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5] dark:focus-visible:ring-offset-neutral-950',
    );

    return (
        <div className="relative min-h-screen overflow-x-clip bg-[#faf8f5] dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
            <a
                href="#contenido"
                className="fixed left-4 top-24 z-[100] -translate-x-[calc(100%+2rem)] focus:translate-x-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 outline-none ring-2 ring-neutral-950/20 transition-transform duration-200"
            >
                Saltar al contenido
            </a>

            <header className="relative z-40 sticky top-0 overflow-visible border-b border-stone-200/90 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md shadow-sm">
                <div
                    className={classNames(
                        'mx-auto max-w-7xl py-2.5 sm:py-3 flex items-center gap-2 sm:gap-2.5 lg:gap-4 lg:flex-nowrap min-w-0',
                        'ps-[max(0.75rem,env(safe-area-inset-left))]',
                        'pe-[max(0.75rem,env(safe-area-inset-right))]',
                        'sm:ps-6 sm:pe-6',
                    )}
                >
                    <button
                        type="button"
                        className="lg:hidden shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-stone-200 dark:border-white/15 p-2.5 touch-manipulation text-stone-800 dark:text-neutral-200 hover:bg-stone-100 dark:hover:bg-white/10"
                        aria-expanded={mobileNavOpen}
                        aria-controls="landing-mobile-nav"
                        onClick={() => setMobileNavOpen((o) => !o)}
                    >
                        <span className="sr-only">Menú</span>
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                            {mobileNavOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    <Link
                        to="/cliente"
                        className="flex flex-1 min-w-0 items-center gap-2 sm:gap-3 lg:flex-none lg:shrink-0 touch-manipulation"
                        onClick={closeMobileNav}
                    >
                        <span className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl sm:rounded-2xl shrink-0 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-neutral-950 font-bold text-sm sm:text-base lg:text-lg shadow-md">
                            R
                        </span>
                        <span className="flex flex-col leading-tight min-w-0 text-left">
                            <span className="font-semibold tracking-tight text-stone-900 dark:text-neutral-50 text-sm sm:text-base lg:text-lg truncate">
                                Proyecto Restaurante
                            </span>
                            <span className="hidden xl:block text-[11px] uppercase tracking-[0.12em] text-stone-500 dark:text-neutral-500 truncate">
                                Cocina & mesa
                            </span>
                        </span>
                    </Link>

                    {/* Navegación horizontal solo pantallas grandes; tableta usa menú */}
                    <nav className="hidden lg:flex flex-1 min-w-0 items-center justify-center xl:justify-center px-2">
                        <ul className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-1 xl:gap-x-1 2xl:gap-x-2 text-[11px] xl:text-[12px] 2xl:text-[13px] font-medium text-stone-700 dark:text-neutral-300 max-w-full">
                            {NAV_LINKS.map(({ href, label }) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        className="inline-flex whitespace-nowrap rounded-full px-2 py-2 sm:px-2.5 xl:px-3 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors tap-highlight-transparent"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2 shrink-0 ml-auto touch-manipulation">
                        <div id="login-esquina" className="relative flex items-center gap-1 min-[375px]:gap-1.5 sm:gap-2">
                            <ThemeToggle />
                            {sesionCliente ? (
                                <>
                                    <Link
                                        to="/cliente/reservas"
                                        className="inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-teal-500/40 bg-teal-500/15 px-2 py-2 min-[375px]:px-3 min-[375px]:py-2 text-[11px] sm:text-xs md:text-sm font-semibold text-teal-900 dark:text-teal-200 hover:bg-teal-500/25 transition-colors whitespace-nowrap"
                                    >
                                        <span className="sm:hidden">Reserva</span>
                                        <span className="hidden sm:inline">Reservar</span>
                                    </Link>
                                    <Link
                                        to="/cliente/carta"
                                        className="inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-amber-400/50 bg-amber-400/15 px-2 py-2 min-[375px]:px-3 min-[375px]:py-2 text-[11px] sm:text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-400/25 transition-colors whitespace-nowrap"
                                    >
                                        <span className="sm:hidden">Carta</span>
                                        <span className="hidden sm:inline">Ver carta</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={cerrarSesionCliente}
                                        className="inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-stone-300 dark:border-white/20 bg-stone-100 dark:bg-white/10 px-2 py-2 min-[375px]:px-3 min-[375px]:py-2 text-[11px] sm:text-xs md:text-sm font-semibold text-stone-800 dark:text-neutral-200 hover:bg-stone-200 dark:hover:bg-white/15 transition-colors whitespace-nowrap"
                                    >
                                        <span className="sm:hidden">Salir</span>
                                        <span className="hidden sm:inline">Cerrar sesión</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => (loginEsquinaAbierto ? cerrarLoginEsquina() : abrirLoginEsquina())}
                                        className={classNames(
                                            'inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border px-2.5 py-2 min-[375px]:px-3 font-semibold transition-all whitespace-nowrap text-[11px] sm:text-xs md:text-sm shadow-sm',
                                            'border-amber-600/70 dark:border-amber-500/55 bg-amber-500 text-stone-950 dark:bg-amber-400 dark:text-neutral-950',
                                            'hover:bg-amber-400 hover:border-amber-500 dark:hover:bg-amber-300 dark:hover:border-amber-400',
                                            'active:scale-[0.98]',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950',
                                            loginEsquinaAbierto &&
                                                'ring-2 ring-amber-600/50 border-amber-700/80 bg-amber-600/90 text-white dark:bg-amber-500 dark:text-neutral-950',
                                        )}
                                        aria-expanded={loginEsquinaAbierto}
                                        aria-haspopup="dialog"
                                    >
                                        {loginEsquinaAbierto ? (
                                            'Cerrar'
                                        ) : (
                                            <>
                                                <img
                                                    src="/iniciar sesion.png"
                                                    alt=""
                                                    className="h-4 w-4 sm:h-[18px] sm:w-[18px] object-contain shrink-0"
                                                    draggable={false}
                                                />
                                                <span className="inline sm:hidden">Entrar</span>
                                                <span className="hidden sm:inline">Iniciar sesión</span>
                                            </>
                                        )}
                                    </button>
                                    {loginEsquinaAbierto ? (
                                        <div
                                            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(22rem,calc(100vw-1.25rem))] max-sm:right-1 max-sm:w-[calc(100vw-1rem)] rounded-2xl border border-stone-200 dark:border-white/15 bg-white dark:bg-neutral-900 shadow-2xl p-4 pt-11 pb-5 max-h-[min(36rem,min(85vh,calc(100dvh-6rem)))] overflow-y-auto overscroll-contain"
                                            role="dialog"
                                            aria-label="Iniciar sesión cliente"
                                        >
                                            <button
                                                type="button"
                                                onClick={cerrarLoginEsquina}
                                                className="absolute top-2 right-2 rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 dark:text-neutral-400"
                                                aria-label="Cerrar inicio de sesión"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            <ClienteLoginPanel
                                                redirectPath={null}
                                                subtitle="Entra o crea tu cuenta"
                                                onSuccess={() => {
                                                    setSesionCliente(true);
                                                    cerrarLoginEsquina();
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    id="landing-mobile-nav"
                    className={classNames(
                        'lg:hidden border-t border-stone-200 dark:border-white/10 bg-white dark:bg-neutral-950 py-4 flex flex-col gap-1 max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto overscroll-contain',
                        'ps-[max(0.875rem,env(safe-area-inset-left))] pe-[max(0.875rem,env(safe-area-inset-right))]',
                        mobileNavOpen ? 'block' : 'hidden',
                    )}
                >
                    {NAV_LINKS.map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            onClick={closeMobileNav}
                            className="rounded-xl px-3 py-3 text-stone-800 dark:text-neutral-200 hover:bg-stone-100 dark:hover:bg-white/10 font-medium"
                        >
                            {label}
                        </a>
                    ))}
                    {sesionCliente ? (
                        <button
                            type="button"
                            onClick={cerrarSesionCliente}
                            className="mt-3 rounded-xl border border-stone-300 dark:border-white/15 bg-stone-100 dark:bg-white/10 px-3 py-3 text-left font-semibold text-stone-800 dark:text-neutral-100 hover:bg-stone-200 dark:hover:bg-white/15"
                        >
                            Cerrar sesión
                        </button>
                    ) : null}
                </div>
            </header>

            {/* Burbuja flotante “Ver carta” */}
            <div
                className={classNames(
                    'fixed z-[60] flex justify-end pointer-events-none',
                    'right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6',
                )}
            >
                <div className="pointer-events-auto flex flex-col items-end gap-2">
                    <Link to="/cliente/carta" className={fabVerCartaClass} aria-label="Ver carta del menú">
                        <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-black/15">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </span>
                        Ver carta
                    </Link>
                </div>
            </div>

            <main id="contenido">
                {/* Hero amplio — mensaje para todo público */}
                <section className="relative overflow-hidden border-b border-stone-200/80 dark:border-white/10">
                    <div
                        className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-3/4 lg:w-2/3 bg-no-repeat bg-right bg-cover opacity-55 dark:opacity-30"
                        style={{
                            backgroundImage: "url('/bandeja%20paisa.jpg')",
                            WebkitMaskImage:
                                'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
                            maskImage:
                                'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%)',
                        }}
                        aria-hidden
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.35),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(251,146,60,0.12),transparent)] dark:opacity-80" />
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
                            Lo más buscado empieza aquí
                        </p>
                        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50 max-w-4xl leading-[1.08]">
                            Conoce nuestra casa de sabores
                        </h1>
                        <p className="mt-6 text-lg sm:text-xl text-stone-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                            Un espacio pensado para familias, amigos y visitantes: mesa cómoda, carta transparente y la opción de ver el menú digital cuando quieras.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <a
                                href="#destacados"
                                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold bg-stone-900 text-white dark:bg-amber-400 dark:text-neutral-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors"
                            >
                                Explorar servicios
                                <span aria-hidden>→</span>
                            </a>
                            <a
                                href="#nosotros"
                                className="inline-flex items-center rounded-full px-7 py-3.5 font-semibold border-2 border-stone-300 dark:border-white/20 text-stone-800 dark:text-neutral-100 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                            >
                                Nosotros
                            </a>
                        </div>
                    </div>
                </section>

                {/* Grid tipo “Lo más buscado” */}
                <section
                    id="destacados"
                    className="group scroll-mt-28 relative overflow-hidden py-16 lg:py-24 bg-white dark:bg-neutral-900/35 border-b border-stone-200/80 dark:border-white/10"
                    onMouseEnter={() => setDestacadosBgHover(true)}
                    onMouseLeave={() => setDestacadosBgHover(false)}
                >
                    <DestacadosBackgroundCarousel activeIndex={destacadosBgIndex} />
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50">
                                    Servicios destacados
                                </h2>
                                <p className="mt-3 text-stone-600 dark:text-neutral-400 max-w-xl">
                                    Accesos rápidos para quien nos visita por primera vez o nos acompaña cada semana.
                                </p>
                            </div>
                        </div>
                        <CarruselServicios items={destacadosLista} />
                    </div>
                </section>

                {/* Carta / acceso: recordatorio (formulario en esquina + burbuja) */}
                <section id="carta" className="scroll-mt-28 relative overflow-hidden">
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-[110%] bg-no-repeat bg-top bg-cover opacity-55 dark:opacity-25"
                        style={{
                            backgroundImage: "url('/salchipapas.png')",
                            WebkitMaskImage:
                                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)',
                            maskImage:
                                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)',
                        }}
                        aria-hidden
                    />
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
                    <div className="rounded-2xl border border-dashed border-stone-300 dark:border-white/15 bg-stone-100/80 dark:bg-white/5 backdrop-blur-sm px-6 py-8 sm:px-10 text-center max-w-3xl mx-auto">
                        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-neutral-50">Carta digital</h2>
                        <p className="mt-3 text-stone-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
                            Pulsa{' '}
                            <Link to="/cliente/carta" className="font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                                ver carta
                            </Link>{' '}
                            para consultar precios sin cuenta (también con la{' '}
                            <strong className="text-stone-800 dark:text-neutral-200">burbuja «Ver carta»</strong>). Para iniciar sesión usa el botón junto al{' '}
                            <strong className="text-stone-800 dark:text-neutral-200">cambio claro / oscuro</strong>; con cuenta cliente también puedes gestionar tus{' '}
                            <strong className="text-stone-800 dark:text-neutral-200">reservas</strong>.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/cliente/carta"
                                className="rounded-full px-6 py-2.5 text-sm font-semibold bg-amber-400 text-neutral-950 hover:bg-amber-300 inline-flex items-center justify-center"
                            >
                                Ver carta
                            </Link>
                            {!sesionCliente ? (
                                <button
                                    type="button"
                                    onClick={abrirLoginEsquina}
                                    className="rounded-full px-6 py-2.5 text-sm font-semibold bg-stone-900 text-white dark:bg-amber-400 dark:text-neutral-950 hover:opacity-90"
                                >
                                    Abrir iniciar sesión
                                </button>
                            ) : (
                                <>
                                    <Link
                                        to="/cliente/reservas"
                                        className="rounded-full px-6 py-2.5 text-sm font-semibold bg-teal-700 text-white hover:bg-teal-600 inline-flex items-center justify-center"
                                    >
                                        Ir a reservas
                                    </Link>
                                    <Link
                                        to="/cliente/carta"
                                        className="rounded-full px-6 py-2.5 text-sm font-semibold border border-amber-400/80 text-amber-800 dark:text-amber-300 hover:bg-amber-400/15 inline-flex items-center justify-center"
                                    >
                                        Ir a la carta
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    </div>
                </section>

                {/* Nosotros */}
                <section id="nosotros" className="scroll-mt-28 py-10 lg:py-14 bg-[#faf8f5] dark:bg-neutral-950">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-10 items-center">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50">
                                Nosotros
                            </h2>
                            <p className="mt-3 text-stone-600 dark:text-neutral-400 leading-relaxed">
                                Restaurante demo con vocación real: cocina ordenada, sala ágil y una carta que puedes explorar desde casa o desde la mesa.
                            </p>
                            <ul className="mt-5 space-y-1.5 text-sm text-stone-700 dark:text-neutral-300">
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">·</span>
                                    Tradición en el servicio y orden en cocina.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">·</span>
                                    Carta digital para reducir dudas al pedir.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">·</span>
                                    Equipo preparado para grupos.
                                </li>
                            </ul>
                        </div>
                        <div className="relative aspect-[5/3] rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 shadow-md bg-gradient-to-br from-amber-100 via-orange-50 to-stone-200 dark:from-amber-950/40 dark:via-neutral-900 dark:to-stone-950">
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest text-amber-900/70 dark:text-amber-400/90 font-medium">
                                        Del horno a tu mesa
                                    </p>
                                    <p className="mt-2 text-lg sm:text-xl font-semibold text-stone-900 dark:text-neutral-50 leading-snug">
                                        Más de una década en cada detalle.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Novedades */}
                <section id="novedades" className="scroll-mt-28 py-16 lg:py-24 bg-[#faf8f5] dark:bg-neutral-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-neutral-50">
                                    Novedades
                                </h2>
                                <p className="mt-3 text-stone-600 dark:text-neutral-400">
                                    Tradición e innovación en cada temporada.
                                </p>
                            </div>
                            <span className="text-sm font-medium text-stone-500 dark:text-neutral-500">Blog · Anuncios</span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {NOVEDADES.map((n, i) => (
                                <article
                                    key={i}
                                    className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-neutral-900/40 p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                        Novedades · {n.fecha}
                                    </p>
                                    <h3 className="mt-4 text-xl font-semibold text-stone-900 dark:text-neutral-50 leading-snug">{n.titulo}</h3>
                                    <p className="mt-3 text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">{n.texto}</p>
                                    <span className="mt-5 inline-block text-sm font-semibold text-amber-700 dark:text-amber-400 opacity-90">
                                        Ver más →
                                    </span>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contacto */}
                <section id="contacto" className="scroll-mt-28 py-16 bg-stone-200/60 dark:bg-neutral-900/50 border-t border-stone-200 dark:border-white/10">
                    <div className="mx-auto max-w-xl px-4 sm:px-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-stone-900 dark:text-neutral-50">Contáctanos</h2>
                            <p className="mt-4 text-stone-600 dark:text-neutral-400 leading-relaxed">
                                Reservas, grupos y sugerencias: escríbenos y te respondemos en horario comercial.
                            </p>
                            <dl className="mt-8 space-y-4 text-sm">
                                <div>
                                    <dt className="font-semibold text-stone-800 dark:text-neutral-200">Correo</dt>
                                    <dd>
                                        <a href="mailto:hola@proyectorestaurante.demo" className="text-amber-700 dark:text-amber-400 hover:underline">
                                            hola@proyectorestaurante.demo
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-stone-800 dark:text-neutral-200">Horario referencial</dt>
                                    <dd className="text-stone-600 dark:text-neutral-400">Lun — Dom · 11:00 — 22:00</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-stone-800 dark:text-neutral-200">Ubicación</dt>
                                    <dd className="text-stone-600 dark:text-neutral-400">Ciudad demo · Carrera 00 # 00 — 00</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </section>

            </main>

            {/* Pie corporativo */}
            <footer className="border-t border-stone-300 dark:border-white/10 bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300 py-14 pb-[max(3.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-lg">
                                <span className="h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center text-neutral-950 font-bold text-sm">
                                    R
                                </span>
                                Proyecto Restaurante
                            </div>
                            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs">
                                Cocina marina con pescados y mariscos frescos, preparados al momento y servidos en un ambiente
                                cálido para disfrutar en familia o con amigos el sabor del mar.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-500 mb-4">Enlaces</h4>
                            <ul className="space-y-2 text-sm">
                                {NAV_LINKS.map(({ href, label }) => (
                                    <li key={href}>
                                        <a href={href} className={footerInteractiveLinkClass}>
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-500 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <button type="button" className={classNames(footerInteractiveLinkClass, 'cursor-pointer')}>
                                        Política de tratamiento de datos
                                    </button>
                                </li>
                                <li>
                                    <button type="button" className={classNames(footerInteractiveLinkClass, 'cursor-pointer')}>
                                        Preguntas frecuentes
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-500 mb-4">Redes</h4>
                            <p className="text-sm text-stone-600 dark:text-stone-400">@proyectorestaurante_demo</p>
                        </div>
                    </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 pt-8 border-t border-stone-300 dark:border-stone-700 text-center text-xs text-stone-600 dark:text-stone-500">
                    Copyright © {new Date().getFullYear()} Proyecto Restaurante · Demo académico
                </div>
            </footer>
        </div>
    );
}
