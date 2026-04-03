import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Menu, 
  X, 
  Globe, 
  Linkedin, 
  Instagram, 
  Youtube,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Logo } from "./components/Logo";

type Language = "it" | "en";

const translations = {
  it: {
    nav: {
      about: "Chi siamo",
      community: "Community",
      space: "Lo spazio",
      contact: "Contatti",
    },
    hero: {
      eyebrow: "Pisa, Italia",
      title1: "Dove il",
      title2: "talento tech",
      title3: "si incontra",
      sub: "Non un coworking. Non un incubatore. Un luogo dove founder, dev, ricercatori e menti ambiziose costruiscono insieme — nel cuore di Pisa.",
      cta: "Entra nell'hub",
      more: "Scopri di più",
      stats: {
        talents: "Talenti residenti",
        ideas: "Idee in circolo",
        hub: "Hub, Pisa centro",
      }
    },
    about: {
      label: "Chi siamo",
      title: "Più di uno spazio. Un ecosistema.",
      prose1: "Traent Hub è il punto di incontro a Pisa per chi lavora nella tecnologia, l'imprenditoria e l'innovazione. Non è un ufficio condiviso — è un ambiente pensato per chi vuole essere circondato da persone che pensano in grande.",
      prose2: "Startup, professionisti tech, ricercatori e talenti ambiziosi — tutti sotto lo stesso tetto. Perché le idee migliori nascono dalle connessioni giuste, non dalle scrivanie giuste.",
      cards: [
        { title: "Focus & deep work", desc: "Spazi progettati per concentrazione vera. Zero distrazioni, massima produttività." },
        { title: "Network che conta", desc: "Connessioni reali, non small talk da aperitivo. Persone che fanno, non che parlano." },
        { title: "Cross-pollination", desc: "Quando ruoli, settori e background si mescolano, succedono cose interessanti." },
        { title: "Energia giusta", desc: "Giovane, dinamico, ambizioso. L'ambiente forma le abitudini — scegli quello giusto." }
      ]
    },
    community: {
      label: "La community",
      title: <>Per chi cerca <span className="text-pop italic font-bold">stimoli e nuove prospettive</span>.</>,
      personas: [
        { idx: "01", title: "Founder", icon: "◆", desc: "Stai costruendo qualcosa di nuovo. Qui trovi co-founder, advisor e le prime conversazioni che contano davvero." },
        { idx: "02", title: "Dev & tech", icon: "⚡", desc: "Professionisti che vogliono lavorare circondati da eccellenza. Codice, architetture, confronto reale." },
        { idx: "03", title: "Ricercatori", icon: "◎", desc: "Dal mondo accademico a quello reale. Porta le tue idee dove possono generare impatto vero." },
        { idx: "04", title: "Ambiziosi", icon: "△", desc: "Cerchi un network migliore e gente che fa sul serio. Non serve un titolo — serve fame." }
      ]
    },
    space: {
      label: "Lo spazio",
      title: "Progettato per chi costruisce.",
      items: [
        { title: "Postazioni dedicate", desc: "Il tuo spazio fisso. La tua routine. La tua community a portata di mano, ogni giorno." },
        { title: "Aree meeting", desc: "Brainstorming, pitch, call importanti. Accesso fluido, zero burocrazia." },
        { title: "Lounge", desc: "Le conversazioni migliori non succedono nei meeting. Succedono davanti a un caffè, per caso." },
        { title: "Spazi startup", desc: "Aree dedicate per team in crescita. Entra con un'idea, esci con un prodotto." }
      ]
    },
    manifesto: {
      label: "Manifesto",
      line: "Non cerchiamo spazi silenziosi. Cerchiamo persone rumorose — che costruiscono, discutono, e fanno accadere le cose.",
      note: "Traent Hub è pensato per chi crede che le idee migliori nascano dal confronto. Se cerchi un ambiente dinamico e persone con cui scambiare visioni, sei nel posto giusto."
    },
    location: {
      label: "Contatti",
      title: "Vieni a trovarci.",
      desc: "Ci trovi nel cuore di Pisa, in Borgo Stretto 3. Per qualsiasi informazione o per fissare una visita, scrivici.",
      email: "hub@traent.com"
    },
    cta: {
      title: "Pronto a entrare?",
      sub: "Scrivici. Raccontaci chi sei e cosa stai costruendo.",
      btn: "Scrivici ora"
    },
    footer: {
      brand: "Il tech hub di Pisa.",
      cols: {
        hub: "Hub",
        social: "Social",
        legal: "Legal"
      }
    }
  },
  en: {
    nav: {
      about: "About",
      community: "Community",
      space: "The Space",
      contact: "Contact",
    },
    hero: {
      eyebrow: "Pisa, Italy",
      title1: "Where",
      title2: "tech talent",
      title3: "converges",
      sub: "Not a coworking. Not an incubator. A place where founders, devs, researchers and ambitious minds build together — in the heart of Pisa.",
      cta: "Join the hub",
      more: "Learn more",
      stats: {
        talents: "Resident talents",
        ideas: "Ideas in motion",
        hub: "Hub, central Pisa",
      }
    },
    about: {
      label: "About",
      title: "More than a space. An ecosystem.",
      prose1: "Traent Hub is Pisa's meeting point for people working in technology, entrepreneurship and innovation. It's not a shared office — it's an environment designed for those who want to be surrounded by people who think big.",
      prose2: "Startups, tech professionals, researchers and ambitious talent — all under one roof. Because the best ideas come from the right connections, not the right desks.",
      cards: [
        { title: "Focus & deep work", desc: "Spaces designed for real focus. Zero distractions, maximum output." },
        { title: "Network that matters", desc: "Real connections, not cocktail small talk. People who do, not who talk." },
        { title: "Cross-pollination", desc: "When roles, sectors and backgrounds mix, interesting things happen." },
        { title: "Right energy", desc: "Young, dynamic, ambitious. Environment shapes habits — choose the right one." }
      ]
    },
    community: {
      label: "Community",
      title: <>For those seeking <span className="text-pop italic font-bold">inspiration and new perspectives</span>.</>,
      personas: [
        { idx: "01", title: "Founders", icon: "◆", desc: "You're building something new. Here you find co-founders, advisors and the early conversations that truly matter." },
        { idx: "02", title: "Dev & tech", icon: "⚡", desc: "Professionals who want to work surrounded by excellence. Code, architectures, real exchange." },
        { idx: "03", title: "Researchers", icon: "◎", desc: "From academia to the real world. Bring your ideas where they can generate real impact." },
        { idx: "04", title: "Ambitious", icon: "△", desc: "You want a better network and people who mean business. No title needed — just hunger." }
      ]
    },
    space: {
      label: "The Space",
      title: "Designed for builders.",
      items: [
        { title: "Dedicated desks", desc: "Your fixed spot. Your routine. Your community within reach, every day." },
        { title: "Meeting areas", desc: "Brainstorming, pitches, key calls. Fluid access, zero bureaucracy." },
        { title: "Lounge", desc: "The best conversations don't happen in meetings. They happen over coffee, by chance." },
        { title: "Startup spaces", desc: "Dedicated areas for growing teams. Enter with an idea, leave with a product." }
      ]
    },
    manifesto: {
      label: "Manifesto",
      line: "We don't look for quiet spaces. We look for loud people — who build, debate, and make things happen.",
      note: "Traent Hub is designed for those who believe the best ideas come from exchange. If you're looking for a dynamic environment and people to share visions with, you're in the right place."
    },
    location: {
      label: "Contact",
      title: "Come visit us.",
      desc: "You can find us in the heart of Pisa, at Borgo Stretto 3. For any information or to schedule a visit, write to us.",
      email: "hub@traent.com"
    },
    cta: {
      title: "Ready to join?",
      sub: "Write to us. Tell us who you are and what you're building.",
      btn: "Get in touch"
    },
    footer: {
      brand: "Pisa's tech hub.",
      cols: {
        hub: "Hub",
        social: "Social",
        legal: "Legal"
      }
    }
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>("it");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentSpaceImage, setCurrentSpaceImage] = useState(0);

  const spaceSlides = [
    { url: "https://picsum.photos/seed/modern-office-space/1000/800", label: "Open Space" },
    { url: "https://picsum.photos/seed/corporate-meeting-room/1000/800", label: "Stanza Meeting" },
    { url: "https://picsum.photos/seed/luxury-lounge-area/1000/800", label: "Zona Lounge" },
    { url: "https://picsum.photos/seed/industrial-cafe-bar/1000/800", label: "Area Bar" },
    { url: "https://picsum.photos/seed/rooftop-terrace-view/1000/800", label: "Terrazza" },
  ];

  const nextSpaceImage = () => setCurrentSpaceImage((prev) => (prev + 1) % spaceSlides.length);
  const prevSpaceImage = () => setCurrentSpaceImage((prev) => (prev - 1 + spaceSlides.length) % spaceSlides.length);

  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setIsNavHidden(true);
      } else {
        setIsNavHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleLang = () => setLang(prev => prev === "it" ? "en" : "it");

  return (
    <div className="min-h-screen selection:bg-pop selection:text-white">
      <div className="grain-overlay" />

      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between bg-paper/85 backdrop-blur-xl border-b border-black/5 transition-transform duration-500 ${isNavHidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <Logo />
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-[10px] tracking-[0.15em] uppercase font-medium text-warm-500 hover:text-ink transition-colors relative group">
              {t.nav.about}
              <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
            <a href="#community" className="text-[10px] tracking-[0.15em] uppercase font-medium text-warm-500 hover:text-ink transition-colors relative group">
              {t.nav.community}
              <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
            <a href="#space" className="text-[10px] tracking-[0.15em] uppercase font-medium text-warm-500 hover:text-ink transition-colors relative group">
              {t.nav.space}
              <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
            <a href="#contact" className="text-[10px] tracking-[0.15em] uppercase font-medium text-warm-500 hover:text-ink transition-colors relative group">
              {t.nav.contact}
              <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
            <button 
              onClick={toggleLang}
              className="font-mono text-[9px] tracking-wider px-3 py-1 border-1.5 border-ink rounded-full hover:bg-ink hover:text-paper transition-all"
            >
              {lang === "it" ? "EN" : "IT"}
            </button>
          </div>
          
          <button 
            className="md:hidden p-2 text-ink"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-paper flex flex-col items-center justify-center gap-8 md:hidden"
          >
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display">{t.nav.about}</a>
            <a href="#community" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display">{t.nav.community}</a>
            <a href="#space" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display">{t.nav.space}</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display">{t.nav.contact}</a>
            <button 
              onClick={() => { toggleLang(); setIsMenuOpen(false); }}
              className="font-mono text-xs border-1.5 border-ink px-4 py-2 rounded-full"
            >
              {lang === "it" ? "ENGLISH" : "ITALIANO"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pb-20 overflow-hidden">
        <div className="hero-grid absolute top-0 right-[-5%] w-[55vw] h-full pointer-events-none" />
        <div className="absolute top-1/2 right-[5%] -translate-y-[55%] font-display text-[clamp(20rem,45vw,55rem)] font-bold leading-[0.8] text-transparent stroke-black/5 select-none pointer-events-none" style={{ WebkitTextStroke: "1px rgba(0,0,0,0.04)" }}>
          H
        </div>

        <div className="relative max-w-[900px] z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-10 h-[2px] bg-pop" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-pop font-medium">{t.hero.eyebrow}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-[clamp(3.2rem,8.5vw,7.5rem)] leading-[1.1] tracking-tighter mb-8 pt-4"
          >
            {t.hero.title1}<br />
            <span className="italic font-bold">{t.hero.title2}</span><br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px var(--color-ink)" }}>{t.hero.title3}</span>
            <span className="text-pop">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-warm-500 max-w-[520px] mb-10 font-light"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a href="#about" className="group inline-flex items-center gap-2.5 px-10 py-5 bg-ink text-paper text-[12px] font-semibold tracking-wider uppercase rounded-full hover:bg-pop hover:-translate-y-0.5 transition-all shadow-2xl shadow-pop/20">
              {t.hero.more}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-20 pt-10 border-t border-black/10 flex flex-wrap gap-12 md:gap-20"
          >
            <div className="flex flex-col">
              <span className="font-display text-4xl md:text-5xl font-bold leading-none">20<span className="text-pop">+</span></span>
              <span className="text-[10px] tracking-[0.12em] uppercase text-warm-400 mt-2 font-medium">{t.hero.stats.talents}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-4xl md:text-5xl font-bold leading-none">∞</span>
              <span className="text-[10px] tracking-[0.12em] uppercase text-warm-400 mt-2 font-medium">{t.hero.stats.ideas}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-4xl md:text-5xl font-bold leading-none">1<span className="text-pop">.</span></span>
              <span className="text-[10px] tracking-[0.12em] uppercase text-warm-400 mt-2 font-medium">{t.hero.stats.hub}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="py-5 overflow-hidden border-y border-black/10 bg-cream">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-warm-400 px-10">
                <span className="text-pop font-medium">Founders</span> — Developers — Researchers — <span className="text-pop font-medium">Startups</span> — Designers — <span className="text-pop font-medium">Ambitious minds</span> — Tech leads — <span className="text-pop font-medium">PhDs</span> — Engineers —
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-pop" />
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.about.label}</span>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-tight max-w-[750px] mb-12"
        >
          {lang === "it" ? (
            <>Più di uno spazio.<br />Un <span className="italic font-bold">ecosistema</span><span className="text-pop">.</span></>
          ) : (
            <>More than a space.<br />An <span className="italic font-bold">ecosystem</span><span className="text-pop">.</span></>
          )}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg leading-relaxed text-warm-500 font-light space-y-5"
          >
            <p>{t.about.prose1.split('<strong>').map((part, i) => i === 0 ? part : <span key={i}><strong className="text-ink font-semibold">{part.split('</strong>')[0]}</strong>{part.split('</strong>')[1]}</span>)}</p>
            <p>{t.about.prose2.split('<strong>').map((part, i) => i === 0 ? part : <span key={i}><strong className="text-ink font-semibold">{part.split('</strong>')[0]}</strong>{part.split('</strong>')[1]}</span>)}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid border border-black/10 rounded-lg overflow-hidden"
          >
            {t.about.cards.map((card, idx) => (
              <div key={idx} className="p-7 border-b border-black/5 last:border-b-0 hover:bg-pop/5 transition-colors flex gap-5">
                <span className="font-display text-3xl font-bold text-pop leading-none">{idx + 1}</span>
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-ink">{card.title}</h4>
                  <p className="text-xs text-warm-400 leading-relaxed font-light">{card.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="bg-ink text-paper py-28 relative overflow-hidden">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-pop" />
            <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-warm-300 font-medium">{t.community.label}</span>
          </div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-tight max-w-[750px] mb-16"
          >
            {t.community.title}
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-white/10 rounded-lg overflow-hidden">
            {t.community.personas.map((persona, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-10 border-r border-white/5 last:border-r-0 relative group hover:bg-white/5 transition-all"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <span className="font-mono text-[8px] tracking-widest text-white/25 uppercase mb-10 block">{persona.idx} —</span>
                <span className="text-3xl mb-4 block grayscale brightness-200">{persona.icon}</span>
                <h3 className="font-display text-2xl font-bold mb-3 leading-tight">{persona.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed font-light">{persona.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Space Section */}
      <section id="space" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-pop" />
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.space.label}</span>
        </div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-tight max-w-[750px] mb-12"
        >
          {lang === "it" ? (
            <>Progettato per chi<br /><span className="italic font-bold">costruisce</span><span className="text-pop">.</span></>
          ) : (
            <>Designed for<br /><span className="italic font-bold">builders</span><span className="text-pop">.</span></>
          )}
        </motion.h2>

        <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="aspect-[5/4] bg-cream rounded-xl border border-black/5 relative overflow-hidden group"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSpaceImage}
                src={spaceSlides[currentSpaceImage].url}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.75, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            <div className="space-grid absolute inset-0 pointer-events-none" />
            
            <div className="absolute top-6 left-6 z-10 font-mono text-[9px] tracking-widest uppercase text-pop bg-paper px-3 py-1.5 rounded-full border border-pop/20">
              {spaceSlides[currentSpaceImage].label}
            </div>

            {/* Slider Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={prevSpaceImage}
                className="w-10 h-10 rounded-full bg-paper/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-pop hover:text-paper transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSpaceImage}
                className="w-10 h-10 rounded-full bg-paper/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-pop hover:text-paper transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {spaceSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSpaceImage(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${currentSpaceImage === idx ? 'bg-pop w-4' : 'bg-paper/50'}`}
                />
              ))}
            </div>

            <div className="absolute bottom-6 right-6 z-10 pointer-events-none hidden md:block opacity-40 grayscale invert">
              <Logo className="scale-75 origin-right" />
            </div>
          </motion.div>

          <div className="space-y-10">
            {t.space.items.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-8"
              >
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full border-2 border-pop" />
                <h4 className="text-base font-semibold mb-1.5">{item.title}</h4>
                <p className="text-[14px] text-warm-500 leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-40 px-6 md:px-12 text-center bg-paper relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-pop" />
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.manifesto.label}</span>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.3] max-w-[850px] mx-auto mb-10"
        >
          {lang === "it" ? (
            <>Non cerchiamo <span className="line-through text-warm-300">spazi silenziosi</span>.<br />Cerchiamo <span className="italic font-bold text-pop">persone rumorose</span><br />che costruiscono, discutono,<br />e fanno accadere le cose.</>
          ) : (
            <>We don't look for <span className="line-through text-warm-300">quiet spaces</span>.<br />We look for <span className="italic font-bold text-pop">loud people</span><br />who build, debate,<br />and make things happen.</>
          )}
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base text-warm-400 max-w-[440px] mx-auto leading-relaxed font-light"
        >
          {t.manifesto.note}
        </motion.p>
      </section>

      {/* Location Section */}
      <div id="contact" className="bg-cream border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 min-h-[500px]">
            <div className="py-24 md:pr-20 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-pop" />
                <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.location.label}</span>
              </div>
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-6">{t.location.title}</h3>
              <p className="text-base text-warm-500 leading-relaxed font-light max-w-md mb-8">{t.location.desc}</p>
              
              <div className="space-y-6">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-warm-300 uppercase mb-2">Email</div>
                  <a href={`mailto:${t.location.email}`} className="text-xl font-display hover:text-pop transition-colors">{t.location.email}</a>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-warm-300 uppercase mb-2">Coordinates</div>
                  <div className="font-mono text-xs tracking-widest text-pop font-medium">43.7167° N, 10.4014° E</div>
                </div>
              </div>
            </div>
            <div className="border-l border-black/5 relative min-h-[400px] md:min-h-full overflow-hidden">
              <iframe 
                src="https://maps.google.com/maps?q=Borgo%20Stretto%203,%20Pisa&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(1) contrast(1.2) opacity(0.8)' }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
              <div className="absolute inset-0 pointer-events-none border-l border-black/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/5 pt-20 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-start gap-12 mb-20">
            <div className="space-y-0">
              <Logo />
              <p className="text-xs text-warm-400 font-light pl-[42px] -mt-1">{t.footer.brand}</p>
            </div>
            
            <div className="flex gap-12 md:gap-20">
              <div className="space-y-4">
                <h5 className="font-mono text-[9px] tracking-[0.2em] uppercase text-warm-300 font-medium">{t.footer.cols.hub}</h5>
                <div className="flex flex-col gap-2">
                  <a href="#about" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.about}</a>
                  <a href="#community" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.community}</a>
                  <a href="#space" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.space}</a>
                  <a href="#contact" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.contact}</a>
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="font-mono text-[9px] tracking-[0.2em] uppercase text-warm-300 font-medium">{t.footer.cols.social}</h5>
                <div className="flex flex-col gap-2">
                  <a href="https://linkedin.com" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">LinkedIn</a>
                  <a href="https://instagram.com" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">Instagram</a>
                  <a href="https://youtube.com" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">YouTube</a>
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="font-mono text-[9px] tracking-[0.2em] uppercase text-warm-300 font-medium">{t.footer.cols.legal}</h5>
                <div className="flex flex-col gap-2">
                  <a href="#" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">Privacy</a>
                  <a href="#" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">Cookie</a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center pt-8 border-t border-black/5 text-[10px] text-warm-400 gap-6">
            <span>© 2026 Traent Hub — Borgo Stretto 3, Pisa</span>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">Li</a>
              <a href="#" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">Ig</a>
              <a href="#" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">Yt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
