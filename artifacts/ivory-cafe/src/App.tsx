import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, Instagram, Leaf, MapPin, Menu as MenuIcon, Navigation, Phone, Star, X } from 'lucide-react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const heroImage = '/ivory-hero.png';
const diningImage = '/ivory-dining.png';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(29 75% 55%)',
    colorForeground: 'hsl(27 25% 18%)',
    colorMutedForeground: 'hsl(27 11% 43%)',
    colorDanger: 'hsl(5 62% 44%)',
    colorBackground: 'hsl(43 42% 94%)',
    colorInput: 'hsl(45 50% 97%)',
    colorInputForeground: 'hsl(27 25% 18%)',
    colorNeutral: 'hsl(36 23% 82%)',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.35rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#f7f1df] rounded-none w-[440px] max-w-full overflow-hidden border border-[#d9cdb3]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!font-display !text-[#34251c] !text-4xl',
    headerSubtitle: '!text-[#6c5c4d]',
    socialButtonsBlockButtonText: '!text-[#34251c]',
    formFieldLabel: '!text-[#34251c]',
    footerActionLink: '!text-[#a85f16] hover:!text-[#34251c]',
    footerActionText: '!text-[#6c5c4d]',
    dividerText: '!text-[#6c5c4d]',
    identityPreviewEditButton: '!text-[#a85f16]',
    formFieldSuccessText: '!text-[#3f6e55]',
    alertText: '!text-[#34251c]',
    logoBox: 'h-16',
    logoImage: 'h-14 w-14',
    socialButtonsBlockButton: '!border-[#d9cdb3] !bg-[#fffdf6] hover:!bg-[#efe5ce]',
    formButtonPrimary: '!bg-[#34251c] hover:!bg-[#a85f16] !text-[#f7f1df]',
    formFieldInput: '!border-[#d9cdb3] !bg-[#fffdf6] !text-[#34251c] focus:!border-[#a85f16]',
    footerAction: '!border-0',
    dividerLine: '!bg-[#d9cdb3]',
    alert: '!border-[#d9cdb3] !bg-[#efe5ce]',
    otpCodeFieldInput: '!border-[#d9cdb3] !bg-[#fffdf6] !text-[#34251c]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

type MenuItem = { name: string; note: string; tag?: 'veg' | 'non-veg' };
type MenuGroup = { title: string; intro: string; items: MenuItem[] };

const menuGroups: Record<'Food' | 'Beverages', MenuGroup[]> = {
  Food: [
    { title: 'North Indian', intro: 'Comforting, familiar favourites for a long lunch or a late dinner.', items: [{ name: 'Paneer Tikka', note: 'A vegetarian classic' }, { name: 'Dal Makhani', note: 'Slow, generous comfort' }, { name: 'Butter Chicken', note: 'A house favourite' , tag: 'non-veg'}, { name: 'Breads & accompaniments', note: 'For the table' }] },
    { title: 'Italian', intro: 'The easy pleasure of pasta, pizza and a table that lingers.', items: [{ name: 'Margherita Pizza', note: 'Simple, familiar, always welcome', tag: 'veg' }, { name: 'Pasta Arrabbiata', note: 'A little heat, a lot of comfort', tag: 'veg' }, { name: 'Creamy Alfredo Pasta', note: 'Rich and unhurried', tag: 'veg' }] },
    { title: 'Asian', intro: 'Bright, shared plates and familiar wok favourites.', items: [{ name: 'Hakka Noodles', note: 'A table staple', tag: 'veg' }, { name: 'Chilli Paneer', note: 'Crisp, lively, vegetarian', tag: 'veg' }, { name: 'Asian wok special', note: 'Ask the team what is on today' }] },
    { title: 'Continental', intro: 'A little more leisurely, with something for every mood.', items: [{ name: 'Veg Sizzler', note: 'A generous all-rounder', tag: 'veg' }, { name: 'Grilled Chicken', note: 'A familiar favourite', tag: 'non-veg' }, { name: 'Cafe-style sandwiches', note: 'Made for an easy afternoon' }] },
    { title: 'Lebanese', intro: 'Fresh, generous plates designed to share.', items: [{ name: 'Hummus & Pita', note: 'For dipping and passing', tag: 'veg' }, { name: 'Falafel Platter', note: 'A vegetarian table favourite', tag: 'veg' }, { name: 'Lebanese mezze', note: 'A little of everything' }] },
  ],
  Beverages: [
    { title: 'Coffee', intro: 'Slow mornings, mid-meal pauses, one more cup.', items: [{ name: 'Espresso & Americano', note: 'The daily ritual' }, { name: 'Cappuccino & Latte', note: 'Soft, warm, familiar' }, { name: 'Cold coffee', note: 'For warmer afternoons' }] },
    { title: 'Bakery', intro: 'Something from the oven, whenever the day calls for it.', items: [{ name: 'Fresh bakery selection', note: 'Ask what is coming out today' }, { name: 'Cakes & pastries', note: 'For one, or for the table' }, { name: 'Bakes to take away', note: 'A small treat for later' }] },
    { title: 'Shakes', intro: 'Thick, cold, and made for the fun part of the menu.', items: [{ name: 'Classic shakes', note: 'A familiar favourite' }, { name: 'Chocolate shake', note: 'For the sweet tooth' }, { name: 'Seasonal shake', note: 'Ask the team what is on today' }] },
    { title: 'Mocktails', intro: 'Bright pours for long lunches and celebratory dinners.', items: [{ name: 'House mocktails', note: 'Fresh, lively, alcohol-free' }, { name: 'Citrus cooler', note: 'A little lift in a glass' }, { name: 'Seasonal cooler', note: 'Ask the team what is on today' }] },
  ],
};

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} — IVORY, Kathgodam`;
    const descriptionTag = document.querySelector('meta[name="description"]') ?? document.createElement('meta');
    descriptionTag.setAttribute('name', 'description');
    descriptionTag.setAttribute('content', description);
    document.head.appendChild(descriptionTag);
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${window.location.origin}${window.location.pathname}`);
    document.head.appendChild(canonical);
  }, [title, description]);
}

function AccountControls({ mobile = false }: { mobile?: boolean }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className={mobile ? 'grid gap-2 pt-5' : 'hidden items-center gap-3 sm:flex'}>
        <Link href="/sign-in" data-testid={mobile ? 'link-mobile-sign-in' : 'link-sign-in'} className={mobile ? 'flex min-h-11 items-center justify-center border border-foreground/20 px-4 font-mono-ivory text-[10px] uppercase tracking-[.12em]' : 'font-mono-ivory text-[10px] uppercase tracking-[.12em] text-foreground/65 transition hover:text-accent'}>
          Sign in
        </Link>
        <Link href="/sign-up" data-testid={mobile ? 'link-mobile-sign-up' : 'link-sign-up'} className={mobile ? 'flex min-h-11 items-center justify-center bg-accent px-4 font-mono-ivory text-[10px] uppercase tracking-[.12em]' : 'font-mono-ivory text-[10px] uppercase tracking-[.12em] text-accent transition hover:text-foreground'}>
          Create an account
        </Link>
      </div>
    );
  }

  return (
    <div className={mobile ? 'grid gap-2 border-t border-foreground/10 pt-5' : 'hidden items-center gap-3 sm:flex'}>
      <Link href="/account" data-testid={mobile ? 'link-mobile-account' : 'link-account'} className={mobile ? 'flex min-h-11 items-center justify-center border border-foreground/20 px-4 font-mono-ivory text-[10px] uppercase tracking-[.12em]' : 'font-mono-ivory text-[10px] uppercase tracking-[.12em] text-foreground/65 transition hover:text-accent'}>
        {user.firstName ? `Hello, ${user.firstName}` : 'Your account'}
      </Link>
      <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid={mobile ? 'button-mobile-sign-out' : 'button-sign-out'} className={mobile ? 'flex min-h-11 items-center justify-center bg-foreground px-4 font-mono-ivory text-[10px] uppercase tracking-[.12em] text-background' : 'font-mono-ivory text-[10px] uppercase tracking-[.12em] text-foreground/45 transition hover:text-foreground'}>
        Sign out
      </button>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const navItems = [{ href: '/', label: 'Home' }, { href: '/menu', label: 'Menu' }, { href: '/about', label: 'About' }, { href: '/visit', label: 'Visit' }];
  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [location]);
  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 md:px-10">
          <Link href="/" data-testid="link-brand" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-foreground/50 font-display text-2xl leading-none">i</span>
            <span className="font-mono-ivory text-[11px] font-bold uppercase tracking-[.24em]">IVORY</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-9 md:flex">
            {navItems.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} className={`font-mono-ivory text-[10px] uppercase tracking-[.16em] transition-colors hover:text-accent ${location === item.href ? 'text-accent' : 'text-foreground/65'}`}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-3">
            <AccountControls />
            <button type="button" onClick={() => setBookingOpen(true)} data-testid="button-header-reserve" className="hidden items-center gap-2 border border-foreground bg-foreground px-4 py-3 font-mono-ivory text-[10px] uppercase tracking-[.12em] text-background transition hover:bg-accent hover:text-foreground sm:flex">Reserve a table <ArrowUpRight size={13} /></button>
            <button type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} data-testid="button-mobile-menu" className="flex h-11 w-11 items-center justify-center border border-foreground/20 md:hidden">{menuOpen ? <X size={19} /> : <MenuIcon size={19} />}</button>
          </div>
        </div>
        {menuOpen && <nav aria-label="Mobile navigation" className="border-t border-foreground/10 bg-background px-5 py-5 md:hidden">{navItems.map((item) => <Link key={item.href} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase()}`} className="flex border-b border-foreground/10 py-4 font-display text-3xl">{item.label}<ChevronRight className="ml-auto" size={24} /></Link>)}<AccountControls mobile /><button type="button" onClick={() => { setBookingOpen(true); setMenuOpen(false); }} data-testid="button-mobile-reserve" className="mt-5 w-full bg-accent px-4 py-4 text-left font-mono-ivory text-[10px] uppercase tracking-[.14em]">Reserve through EazyDiner <ArrowUpRight className="float-right" size={14} /></button></nav>}
      </header>
      {children}
      <Footer onReserve={() => setBookingOpen(true)} />
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </div>
  );
}

function BookingModal({ onClose }: { onClose: () => void }) {
  return <div role="dialog" aria-modal="true" aria-labelledby="booking-title" className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 p-0 sm:items-center sm:p-6">
    <div className="w-full max-w-lg border border-foreground/20 bg-background p-6 shadow-2xl sm:p-9">
      <div className="flex items-start justify-between"><div><p className="eyebrow text-accent">Reservations</p><h2 id="booking-title" className="mt-3 font-display text-4xl">Save your table.</h2></div><button type="button" onClick={onClose} aria-label="Close reservation dialog" data-testid="button-close-reservation" className="p-2"><X size={20} /></button></div>
      <p className="mt-5 max-w-sm text-sm leading-6 text-foreground/65">Reservations are handled through EazyDiner. The direct destination is being added here soon; for now, call IVORY and the team will help you plan your visit.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2"><a href="tel:09759235352" data-testid="link-call-reservations" className="flex min-h-12 items-center justify-center gap-2 bg-foreground px-4 py-3 font-mono-ivory text-[10px] uppercase tracking-[.12em] text-background"><Phone size={14} /> Call 097592 35352</a><button type="button" onClick={onClose} data-testid="button-reservation-placeholder" className="flex min-h-12 items-center justify-center gap-2 border border-foreground/20 px-4 py-3 font-mono-ivory text-[10px] uppercase tracking-[.12em]">EazyDiner link pending <ArrowUpRight size={14} /></button></div>
      <p className="mt-5 font-mono-ivory text-[9px] uppercase tracking-[.12em] text-foreground/45">External destination placeholder — link to be supplied</p>
    </div>
  </div>;
}

function Footer({ onReserve }: { onReserve: () => void }) {
  return <footer className="bg-foreground px-5 py-14 text-background md:px-10 md:py-20">
    <div className="mx-auto max-w-[1400px]">
      <div className="grid gap-12 md:grid-cols-[1.3fr_.7fr_.7fr]">
        <div><p className="font-mono-ivory text-[10px] uppercase tracking-[.18em] text-background/55">The modern cafe and eatery</p><p className="mt-5 max-w-md font-display text-5xl leading-[.93] md:text-7xl">Come for the coffee. Stay for the evening.</p></div>
        <div><p className="eyebrow text-accent">Find us</p><p className="mt-4 text-sm leading-6 text-background/70">Janki High Street,<br />above Bank of Baroda<br />Sheesh Mahal, Kathgodam<br />Damua Dhunga, Uttarakhand 263126</p><Link href="/visit" data-testid="link-footer-visit" className="mt-5 inline-flex items-center gap-2 font-mono-ivory text-[10px] uppercase tracking-[.12em] text-accent">Plan your visit <ArrowUpRight size={13} /></Link></div>
        <div><p className="eyebrow text-accent">Keep in touch</p><a href="tel:09759235352" data-testid="link-footer-phone" className="mt-4 block font-display text-2xl">097592 35352</a><p className="mt-2 text-sm text-background/60">Open daily until 11 PM</p><div className="mt-6 flex gap-3"><button type="button" onClick={onReserve} data-testid="button-footer-reserve" className="border border-background/30 px-4 py-3 font-mono-ivory text-[10px] uppercase tracking-[.1em] transition hover:bg-background hover:text-foreground">Reserve a table</button><a href="#instagram-placeholder" data-testid="link-footer-instagram" className="flex items-center justify-center border border-background/30 px-3 transition hover:bg-background hover:text-foreground" aria-label="Instagram placeholder"><Instagram size={15} /></a></div></div>
      </div>
      <div className="mt-16 flex flex-col gap-3 border-t border-background/15 pt-5 font-mono-ivory text-[9px] uppercase tracking-[.12em] text-background/40 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} IVORY, Kathgodam</span><span>Instagram · Zomato · EazyDiner destinations pending</span></div>
    </div>
  </footer>;
}

function Home() {
  usePageMeta('Modern Cafe & Eatery in Kathgodam', 'IVORY is a premium all-day cafe and multi-cuisine restaurant in Kathgodam, Uttarakhand. Coffee, bakery, lunch and dinner until 11 PM.');
  const [bookingOpen, setBookingOpen] = useState(false);
  return <main>
    <section className="relative flex min-h-[720px] items-end overflow-hidden bg-foreground pt-[76px] text-background md:min-h-[820px]">
      <img src={heroImage} alt="Coffee and pastry on a warm cafe table at IVORY" width="1600" height="900" className="absolute inset-0 h-full w-full object-cover opacity-65" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/55 to-foreground/15" />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="max-w-4xl reveal"><p className="eyebrow text-accent">Kathgodam · Uttarakhand</p><h1 className="mt-6 max-w-4xl font-display text-[clamp(4.5rem,12vw,10.5rem)] leading-[.78] tracking-[-.04em]">All day.<br /><em>All yours.</em></h1><p className="mt-8 max-w-md text-base leading-7 text-background/75 md:text-lg">A modern cafe and eatery for slow coffees, easy lunches, long dinners and the people you want around the table.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/menu" data-testid="link-hero-menu" className="inline-flex min-h-12 items-center gap-3 bg-accent px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-foreground">Explore the menu <ArrowUpRight size={15} /></Link><Link href="/visit" data-testid="link-hero-visit" className="inline-flex min-h-12 items-center gap-3 border border-background/40 px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-background">Find IVORY <MapPin size={15} /></Link></div></div>
      </div>
      <div className="absolute bottom-6 right-5 hidden items-center gap-3 font-mono-ivory text-[9px] uppercase tracking-[.18em] text-background/60 md:flex"><span className="h-px w-12 bg-background/40" />Open daily until 11 PM</div>
    </section>
    <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-32">
      <div className="grid gap-14 md:grid-cols-[.7fr_1.3fr] md:gap-20"><div><p className="eyebrow text-accent">The IVORY feeling</p></div><div><h2 className="max-w-3xl font-display text-5xl leading-[.95] md:text-7xl">A little more room in the day.</h2><p className="mt-7 max-w-xl text-lg leading-8 text-foreground/65">Come as you are. Meet someone new, mark something special, or take your time with a coffee and nowhere else to be. IVORY moves with the day — bright in the morning, generous at lunch, unhurried after dark.</p><div className="mt-9"><Link href="/about" data-testid="link-home-about" className="inline-flex items-center gap-3 border-b border-foreground pb-3 font-mono-ivory text-[10px] uppercase tracking-[.14em]">More about IVORY <ChevronRight size={15} /></Link></div></div></div>
    </section>
    <section className="bg-secondary/55 px-5 py-16 md:px-10 md:py-24"><div className="mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-[1.05fr_.95fr]"><div className="overflow-hidden"><img src={diningImage} alt="Warm, intimate dining room at IVORY" width="1200" height="900" loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-[1.03]" /></div><div className="md:pl-8"><p className="eyebrow text-accent">Made for your kind of evening</p><h2 className="mt-5 max-w-xl font-display text-5xl leading-[.92] md:text-7xl">One table.<br /><em>Many moods.</em></h2><div className="mt-10 grid max-w-md grid-cols-2 gap-x-7 gap-y-8 border-t border-foreground/20 pt-7">{[['01', 'Quiet coffee'], ['02', 'Birthday dinners'], ['03', 'Easy lunches'], ['04', 'Date nights']].map(([number, label]) => <div key={number}><span className="font-mono-ivory text-[10px] text-accent">{number}</span><p className="mt-2 font-display text-2xl">{label}</p></div>)}</div></div></div></section>
    <section className="bg-accent px-5 py-16 md:px-10 md:py-24"><div className="mx-auto flex max-w-[1400px] flex-col gap-9 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow text-foreground/70">What is on the table</p><h2 className="mt-5 max-w-3xl font-display text-5xl leading-[.9] md:text-8xl">North Indian to Lebanese. Coffee to mocktails.</h2></div><Link href="/menu" data-testid="link-home-full-menu" className="inline-flex shrink-0 items-center gap-3 border-b border-foreground pb-3 font-mono-ivory text-[10px] uppercase tracking-[.14em]">See the full menu <ArrowUpRight size={15} /></Link></div></section>
    <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28"><div className="grid gap-12 md:grid-cols-[1fr_.9fr]"><div><p className="eyebrow text-accent">Guest notes</p><div className="mt-7 flex items-center gap-5"><span className="font-display text-7xl">4.7</span><div><div className="flex gap-1 text-accent" aria-label="4.7 out of 5 stars">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill="currentColor" />)}</div><p className="mt-2 font-mono-ivory text-[10px] uppercase tracking-[.12em] text-foreground/50">496 Google reviews</p></div></div></div><div className="border-l border-foreground/15 pl-7 md:pl-12"><p className="font-display text-3xl leading-tight md:text-4xl">“A place people return to for the atmosphere, the range of food, and the feeling of having time.”</p><p className="mt-5 font-mono-ivory text-[9px] uppercase tracking-[.14em] text-foreground/45">A paraphrase of recurring public review themes</p></div></div></section>
    <section className="bg-foreground px-5 py-16 text-background md:px-10 md:py-24"><div className="mx-auto flex max-w-[1400px] flex-col gap-8 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow text-accent">Ready when you are</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-[.92] md:text-7xl">Make an evening of it.</h2></div><button type="button" onClick={() => setBookingOpen(true)} data-testid="button-home-reserve" className="inline-flex min-h-12 items-center gap-3 self-start bg-accent px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-foreground">Reserve through EazyDiner <CalendarDays size={15} /></button></div></section>
    {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
  </main>;
}

function MenuPage() {
  usePageMeta('Menu — Food & Beverages', 'Browse the IVORY menu in Kathgodam: North Indian, Italian, Asian, Continental, Lebanese, coffee, bakery, shakes and mocktails.');
  const [menuType, setMenuType] = useState<'Food' | 'Beverages'>('Food');
  const [diet, setDiet] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const groups = useMemo(() => menuGroups[menuType].map((group) => ({ ...group, items: group.items.filter((item) => diet === 'All' || !item.tag || item.tag === diet.toLowerCase()) })), [diet, menuType]);
  return <main className="pt-[76px]"><section className="bg-foreground px-5 py-20 text-background md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]"><p className="eyebrow text-accent">A generous table</p><h1 className="mt-5 max-w-4xl font-display text-[clamp(4rem,10vw,9rem)] leading-[.8]">Good food,<br /><em>no hard rules.</em></h1><p className="mt-8 max-w-xl text-base leading-7 text-background/70">A multi-cuisine menu for whatever the day asks of you. Settle in, scan the room, and choose your own pace.</p></div></section><section className="sticky top-[76px] z-20 border-b border-foreground/10 bg-background/95 px-5 py-4 backdrop-blur md:px-10"><div className="mx-auto flex max-w-[1400px] flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-1" role="tablist" aria-label="Menu type">{(['Food', 'Beverages'] as const).map((type) => <button type="button" role="tab" aria-selected={menuType === type} key={type} onClick={() => setMenuType(type)} data-testid={`button-menu-${type.toLowerCase()}`} className={`min-h-11 px-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] transition ${menuType === type ? 'bg-foreground text-background' : 'border border-foreground/15 hover:border-foreground/50'}`}>{type}</button>)}</div><div className="flex items-center gap-2"><span className="mr-2 font-mono-ivory text-[9px] uppercase tracking-[.12em] text-foreground/45">Filter</span>{(['All', 'Veg', 'Non-Veg'] as const).map((option) => <button type="button" key={option} onClick={() => setDiet(option)} data-testid={`button-filter-${option.toLowerCase()}`} className={`min-h-10 border px-3 font-mono-ivory text-[9px] uppercase tracking-[.1em] ${diet === option ? 'border-accent bg-accent' : 'border-foreground/15'}`}>{option}</button>)}</div></div></section><section className="mx-auto max-w-[1400px] px-5 py-14 md:px-10 md:py-20"><div className="space-y-16">{groups.map((group, groupIndex) => <article key={group.title} className="grid gap-7 border-b border-foreground/15 pb-14 md:grid-cols-[.65fr_1.35fr]"><div><p className="font-mono-ivory text-[10px] text-accent">0{groupIndex + 1}</p><h2 className="mt-4 font-display text-5xl leading-[.9] md:text-6xl">{group.title}</h2><p className="mt-4 max-w-xs text-sm leading-6 text-foreground/60">{group.intro}</p></div><div className="divide-y divide-foreground/15">{group.items.map((item) => <div key={item.name} data-testid={`menu-item-${item.name.toLowerCase().replaceAll(' ', '-')}`} className="flex items-start justify-between gap-4 py-5 first:pt-0"><div><h3 className="font-display text-2xl">{item.name}</h3><p className="mt-1 text-sm text-foreground/55">{item.note}</p></div>{item.tag && <span className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${item.tag === 'veg' ? 'border-[hsl(157_25%_37%)] text-[hsl(157_25%_37%)]' : 'border-accent text-accent'}`} title={item.tag === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}><Leaf size={11} /></span>}</div>)}</div></article>)}</div><p className="mt-12 font-mono-ivory text-[9px] uppercase tracking-[.13em] text-foreground/45">Menu selections and availability may change. Please ask the IVORY team about today’s selection.</p></section></main>;
}

function AboutPage() {
  usePageMeta('About IVORY — A Cafe for the Whole Day', 'Meet IVORY, a modern cafe and multi-cuisine eatery above Bank of Baroda on Janki High Street in Kathgodam.');
  return <main className="pt-[76px]"><section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-32"><p className="eyebrow text-accent">About IVORY</p><h1 className="mt-6 max-w-6xl font-display text-[clamp(4.2rem,11vw,10rem)] leading-[.78]">A good place<br />to <em>be.</em></h1><div className="mt-14 grid gap-10 md:grid-cols-[.7fr_1.3fr] md:gap-20"><div><span className="block h-px w-20 bg-accent" /><p className="mt-5 font-mono-ivory text-[10px] uppercase tracking-[.14em] text-foreground/50">Kathgodam, Uttarakhand</p></div><div><p className="max-w-2xl font-display text-3xl leading-tight md:text-5xl">IVORY is the kind of cafe that can carry a whole day — from the first coffee to dinner with a few more people than you planned.</p><p className="mt-7 max-w-xl text-base leading-7 text-foreground/65">Our menu moves freely between North Indian, Italian, Asian, Continental and Lebanese food, with coffee, bakery, shakes and mocktails for the in-between moments.</p></div></div></section><section className="bg-secondary/55 px-5 py-16 md:px-10 md:py-24"><div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center"><img src={diningImage} alt="Interior details at IVORY cafe" width="1200" height="900" loading="lazy" className="aspect-[4/3] w-full object-cover" /><div className="md:pl-10"><p className="eyebrow text-accent">The room</p><h2 className="mt-5 font-display text-5xl leading-[.9] md:text-7xl">Warm light.<br /><em>Easy company.</em></h2><p className="mt-7 max-w-md text-base leading-7 text-foreground/65">A considered, comfortable setting above Janki High Street — made for a quiet cup, a catch-up, and dinners that do not need a reason.</p></div></div></section><section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28"><div className="grid gap-12 md:grid-cols-3"><div><p className="eyebrow text-accent">The menu in three acts</p></div>{[['01', 'Come hungry', 'A broad menu means everyone at the table can find their way in.'], ['02', 'Stay a while', 'Coffee, bakery, shakes and mocktails keep the afternoon open.'], ['03', 'Leave happy', 'A familiar kind of place, worth coming back to.']].map(([number, title, copy]) => <div key={number} className="border-t border-foreground/20 pt-5"><span className="font-mono-ivory text-[10px] text-accent">{number}</span><h2 className="mt-4 font-display text-3xl">{title}</h2><p className="mt-3 text-sm leading-6 text-foreground/60">{copy}</p></div>)}</div></section></main>;
}

function VisitPage() {
  usePageMeta('Visit IVORY — Kathgodam, Uttarakhand', 'Find IVORY at Janki High Street above Bank of Baroda, Sheesh Mahal, Kathgodam. Open daily until 11 PM.');
  return <main className="pt-[76px]"><section className="bg-accent px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]"><p className="eyebrow text-foreground/70">Your table is waiting</p><h1 className="mt-6 max-w-5xl font-display text-[clamp(4.5rem,11vw,10rem)] leading-[.78]">Come find<br />your <em>way here.</em></h1></div></section><section className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24"><div className="grid gap-14 md:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow text-accent">The details</p><div className="mt-8 space-y-8"><div className="flex gap-4"><MapPin className="mt-1 shrink-0 text-accent" size={19} /><div><h2 className="font-display text-2xl">Where to find us</h2><p className="mt-2 text-sm leading-6 text-foreground/65">Janki High Street<br />Above Bank of Baroda<br />Sheesh Mahal, Kathgodam<br />Damua Dhunga, Uttarakhand 263126</p></div></div><div className="flex gap-4"><Clock3 className="mt-1 shrink-0 text-accent" size={19} /><div><h2 className="font-display text-2xl">When to visit</h2><p className="mt-2 text-sm leading-6 text-foreground/65">Open daily until 11 PM</p></div></div><div className="flex gap-4"><Phone className="mt-1 shrink-0 text-accent" size={19} /><div><h2 className="font-display text-2xl">Call the team</h2><a href="tel:09759235352" data-testid="link-visit-phone" className="mt-2 block text-sm text-foreground/65 underline decoration-accent underline-offset-4">097592 35352</a></div></div></div></div><div><div className="flex min-h-[370px] flex-col justify-between border border-foreground/15 bg-secondary/55 p-7 md:min-h-[460px] md:p-10"><div className="flex items-start justify-between"><div><p className="eyebrow text-accent">How to arrive</p><h2 className="mt-5 max-w-sm font-display text-5xl leading-[.9]">Look for IVORY above the bank.</h2></div><Navigation className="text-accent" size={28} /></div><div><div className="mb-5 h-px w-full bg-foreground/15" /><p className="max-w-md text-sm leading-6 text-foreground/60">We are in Janki High Street, at Sheesh Mahal in Kathgodam. Use the address above for your preferred map service.</p><a href="https://maps.google.com/?q=Janki+High+Street+Kathgodam" target="_blank" rel="noopener noreferrer" data-testid="link-open-map" className="mt-6 inline-flex min-h-12 items-center gap-3 bg-foreground px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-background">Open map <ArrowUpRight size={14} /></a></div></div></div></div></section><section className="bg-foreground px-5 py-16 text-background md:px-10 md:py-24"><div className="mx-auto flex max-w-[1400px] flex-col gap-8 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow text-accent">Planning ahead?</p><h2 className="mt-4 font-display text-5xl leading-[.9] md:text-7xl">Reservations via EazyDiner.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-background/65">The direct booking destination will be linked here soon. For now, call us and we will help.</p></div><a href="tel:09759235352" data-testid="link-visit-call" className="inline-flex min-h-12 items-center gap-3 self-start bg-accent px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-foreground"><Phone size={15} /> Call IVORY</a></div></section></main>;
}

function AccountPage() {
  usePageMeta('Your IVORY Account', 'Manage your IVORY account and stay connected with the modern cafe and eatery in Kathgodam.');
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  return (
    <main className="min-h-[70vh] px-5 pb-24 pt-[150px] md:px-10">
      <section className="mx-auto max-w-[920px]">
        <p className="eyebrow text-accent">Your IVORY account</p>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-end">
          <div>
            <h1 className="max-w-3xl font-display text-[clamp(4rem,9vw,8rem)] leading-[.8]">
              Welcome{user.firstName ? `, ${user.firstName}` : ''}.
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-foreground/65">
              You are signed in to IVORY. Keep this space close for future reservations, updates, and the next reason to come by.
            </p>
          </div>
          <div className="border-t border-foreground/15 pt-5 md:border-l md:border-t-0 md:pl-8">
            <p className="eyebrow text-foreground/45">Signed in as</p>
            <p className="mt-3 break-all font-display text-2xl">{user.primaryEmailAddress?.emailAddress ?? 'Your IVORY account'}</p>
            <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-account-sign-out" className="mt-7 inline-flex min-h-12 items-center gap-3 bg-foreground px-5 py-4 font-mono-ivory text-[10px] uppercase tracking-[.13em] text-background transition hover:bg-accent hover:text-foreground">
              Sign out <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/account" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function AccountRoute() {
  return (
    <>
      <Show when="signed-in">
        <AccountPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const previousUserId = useState<string | null | undefined>(undefined);
  const previousUserIdRef = previousUserId[0];
  const setPreviousUserId = previousUserId[1];

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserIdRef !== undefined && previousUserIdRef !== userId) {
        queryClient.clear();
      }
      setPreviousUserId(userId);
    });
    return unsubscribe;
  }, [addListener, previousUserIdRef, setPreviousUserId]);

  return null;
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={SiteRouter} />
      </Switch>
    </ErrorBoundary>
  );
}

function SiteRouter() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/visit" component={VisitPage} />
        <Route path="/account" component={AccountRoute} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const stripBase = (path: string) => basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to keep IVORY close',
          },
        },
        signUp: {
          start: {
            title: 'Create your IVORY account',
            subtitle: 'Stay close to your next table',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Router />
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;