import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Menu,
  X,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Logo } from "./components/Logo";

type Language = "it" | "en";

const SPACE_SLIDE_PATHS = [
  "/spazio/01-piazza.png",
  "/spazio/06-sala-principale.png",
  "/spazio/05-stanza-storica.png",
  "/spazio/04-presentazioni.png",
] as const;

const translations = {
  it: {
    nav: {
      about: "Cos'è",
      community: "Community",
      space: "Lo spazio",
      manifesto: "Manifesto",
      contact: "Contatti",
    },
    hero: {
      eyebrow: "",
      title1: "Common ground for",
      title2: "bold minds",
      title3: "",
      strikeText: "Non un semplice coworking.",
      sub: "Nel cuore di Pisa, un palazzo storico diventa una Residency gratuita permanente dove founder, dev, ricercatori e builder innovano, insieme.",
      cta: "Entra nell'hub",
      more: "Scopri di più",
      stats: {
        cost: { value: "0€", label: "Residency gratuita" },
        access: { value: "24/7", label: "Accesso allo spazio" },
      }
    },
    about: {
      label: "Cos'è",
      title: "Più di uno spazio. Un ecosistema.",
      prose1: "Traent Hub seleziona talenti eccezionali, tech builder e domain innovator, e li riunisce in uno spazio gratuito nel cuore di Pisa. Qui la contaminazione tra discipline genera nuove idee, connessioni e progetti reali. Il nostro obiettivo è creare il substrato giusto per far crescere i talenti e le loro idee.",
      prose2: "",
      cards: [
        { title: "Merito", desc: "Qui conta chi sei e cosa fai. Standard alti, selezione rigorosa: essere un Resident di Traent Hub deve significare qualcosa." },
        { title: "Contaminazione", desc: "La mescolanza di discipline, background e visioni è il motore reale dell'innovazione." },
        { title: "Builder Culture", desc: "Si valorizza l'attitudine all'innovazione, al confronto e alla crescita. Non chi appare, ma chi costruisce." },
        { title: "Comunità", desc: "Connessioni che durano oltre la residency e trasformano le prospettive dei talenti pisani." },
        { title: "Gratuità", desc: "Non si paga, si viene scelti. Zero canoni, zero equity. La tua IP resta tua al 100%." }
      ]
    },
    community: {
      label: "La community",
      title: <><span className="text-pop italic font-bold">Persone</span>, non postazioni.</>,
      personas: [
        { idx: "01", title: "Builders", icon: "⚡", desc: "Professionisti in AI, Software Engineering, Product & Design, Blockchain. Circondati da eccellenza, cercano peer di livello e possibili co-founder." },
        { idx: "02", title: "Ricercatori", icon: "◎", desc: "Dottorandi e accademici che vogliono portare le proprie idee fuori dall'università. Il ponte tra il mondo accademico e quello reale." },
        { idx: "03", title: "Founder", icon: "◆", desc: "Chi sta costruendo qualcosa e cerca il co-founder, il primo advisor, o il contesto giusto per far crescere un'idea." },
        { idx: "04", title: "Domain Innovators", icon: "△", desc: "Esperti da domini non tech come biologia, economia, architettura, con una visione chiara di come la tecnologia può trasformare il loro campo." },
        { idx: "05", title: "Studenti", icon: "✦", desc: "Il ponte per la realizzazione di nuove idee, il contatto con le industrie e la formazione continua. Traent Hub è il luogo dove crescere." }
      ]
    },
    space: {
      label: "Lo spazio",
      title: "Progettato per chi innova, insieme.",
      items: [
        { title: "Postazioni dedicate", desc: "Il tuo spazio fisso. La tua routine. La tua community a portata di mano, ogni giorno." },
        { title: "Aree meeting", desc: "Brainstorming, pitch, call importanti. Accesso fluido, zero burocrazia." },
        { title: "Lounge", desc: "Le conversazioni migliori non succedono nei meeting. Succedono davanti a un caffè, per caso." },
        { title: "Spazi startup", desc: "Aree dedicate per team in crescita. Entra con un'idea, esci con un prodotto." },
        { title: "Eventi e formazione", desc: "Hackathon, workshop, serate tematiche. Formazione continua e confronto con chi fa la differenza nel settore." }
      ]
    },
    manifesto: {
      label: "Manifesto",
      mainBlock: "A Pisa il talento non manca, mancava il substrato giusto per farlo crescere.\nTraent Hub è quel substrato.",
    },
    location: {
      label: "Contatti",
      title: "Vieni a trovarci.",
      desc: "Ci trovi nel cuore di Pisa, in Via Borgo Stretto 3. La residency è trimestrale e rinnovabile. Per candidarti o per informazioni, scrivici.",
      email: "contact@traenthub.com"
    },
    cta: {
      title: "Vuoi far parte della prossima cohort?",
      sub: "Le application aprono ogni trimestre. Raccontaci cosa stai costruendo e cosa porteresti alla community.",
      btn: "Candidati ora"
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
      about: "What is it",
      community: "Community",
      space: "The Space",
      manifesto: "Manifesto",
      contact: "Contact",
    },
    hero: {
      eyebrow: "",
      title1: "Common ground for",
      title2: "bold minds",
      title3: "",
      strikeText: "Not just another coworking.",
      sub: "In the heart of Pisa, a historic building becomes a permanent free Residency where founders, developers, researchers and builders innovate, together.",
      cta: "Join the hub",
      more: "Learn more",
      stats: {
        cost: { value: "0€", label: "Free residency" },
        access: { value: "24/7", label: "Space access" },
      }
    },
    about: {
      label: "What is it",
      title: "More than a space. An ecosystem.",
      prose1: "Traent Hub selects exceptional talents, tech builders and domain innovators, and brings them together in a free space in the heart of Pisa. Here, cross-disciplinary contamination generates new ideas, connections and real projects. Our goal is to create the right substrate for talents and their ideas to grow.",
      prose2: "",
      cards: [
        { title: "Merit", desc: "What matters is who you are and what you do. High standards, rigorous selection: being a Traent Hub Resident must mean something." },
        { title: "Contamination", desc: "The mix of disciplines, backgrounds and visions is the real engine of innovation." },
        { title: "Builder Culture", desc: "We value the attitude to innovate, confront and grow. Not who appears, but who builds." },
        { title: "Community", desc: "Connections that last beyond residency and transform the perspectives of Pisan talents." },
        { title: "Free", desc: "You don't pay, you get chosen. Zero fees, zero equity. Your IP stays 100% yours." }
      ]
    },
    community: {
      label: "Community",
      title: <><span className="text-pop italic font-bold">People</span>, not desks.</>,
      personas: [
        { idx: "01", title: "Builders", icon: "⚡", desc: "Professionals in AI, Software Engineering, Product & Design, Blockchain. Surrounded by excellence, looking for peers and potential co-founders." },
        { idx: "02", title: "Researchers", icon: "◎", desc: "PhD candidates and academics who want to bring their ideas out of the university. The bridge between academia and the real world." },
        { idx: "03", title: "Founder", icon: "◆", desc: "Those building something new and looking for a co-founder, the first advisor, or the right context to grow an idea." },
        { idx: "04", title: "Domain Innovators", icon: "△", desc: "Experts from non-tech fields like biology, economics, architecture, with a clear vision of how technology can transform their domain." },
        { idx: "05", title: "Students", icon: "✦", desc: "The bridge for realizing new ideas, connecting with industries and continuous learning. Traent Hub is the place to grow." }
      ]
    },
    space: {
      label: "The Space",
      title: "Designed for those who innovate, together.",
      items: [
        { title: "Dedicated desks", desc: "Your fixed spot. Your routine. Your community within reach, every day." },
        { title: "Meeting areas", desc: "Brainstorming, pitches, key calls. Fluid access, zero bureaucracy." },
        { title: "Lounge", desc: "The best conversations don't happen in meetings. They happen over coffee, by chance." },
        { title: "Startup spaces", desc: "Dedicated areas for growing teams. Enter with an idea, leave with a product." },
        { title: "Events and learning", desc: "Hackathons, workshops, themed evenings. Continuous learning and exchange with those who make a difference in the industry." }
      ]
    },
    manifesto: {
      label: "Manifesto",
      mainBlock: "In Pisa, talent is not missing. What was missing was the right substrate to grow it.\nTraent Hub is that substrate.",
    },
    location: {
      label: "Contact",
      title: "Come visit us.",
      desc: "You can find us in the heart of Pisa, at Via Borgo Stretto 3. The residency is quarterly and renewable. To apply or for information, write to us.",
      email: "contact@traenthub.com"
    },
    cta: {
      title: "Want to join the next cohort?",
      sub: "Applications open every quarter. Tell us what you're building and what you'd bring to the community.",
      btn: "Apply now"
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

  const t = translations[lang];

  const nextSpaceImage = () => setCurrentSpaceImage((prev) => (prev + 1) % SPACE_SLIDE_PATHS.length);
  const prevSpaceImage = () => setCurrentSpaceImage((prev) => (prev - 1 + SPACE_SLIDE_PATHS.length) % SPACE_SLIDE_PATHS.length);

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
            <a href="#manifesto" className="text-[10px] tracking-[0.15em] uppercase font-medium text-warm-500 hover:text-ink transition-colors relative group">
              {t.nav.manifesto}
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
            <a href="#manifesto" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display">{t.nav.manifesto}</a>
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
      <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pt-24 pb-20 overflow-hidden">
        <div className="hero-grid absolute top-0 right-[-5%] w-[55vw] h-full pointer-events-none" />
        <div className="absolute top-1/2 right-[5%] -translate-y-[55%] font-display text-[clamp(20rem,45vw,55rem)] font-bold leading-[0.8] text-transparent stroke-black/5 select-none pointer-events-none" style={{ WebkitTextStroke: "1px rgba(0,0,0,0.04)" }}>
          H
        </div>

        <div className="relative max-w-[900px] z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-[clamp(3.2rem,8.5vw,7.5rem)] leading-[1.1] tracking-tighter mb-8 pt-4"
          >
            {t.hero.title1}<br />
            <span className="italic font-bold text-pop">{t.hero.title2}</span>
            <span className="text-ink">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-[clamp(1.1rem,1.8vw,1.4rem)] leading-relaxed text-warm-400 max-w-[600px] mb-4 font-light"
          >
            <span className="line-through decoration-warm-300 mr-3">{t.hero.strikeText}</span>{lang === "it" ? "Il tech hub di Pisa." : "Pisa's tech hub."}
          </motion.p>

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
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 pt-10 border-t border-black/10 flex justify-center gap-16 md:gap-28"
        >
          {(Object.values(t.hero.stats) as Array<{value: string; label: string}>).map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="font-display text-5xl md:text-6xl font-bold leading-none">{stat.value}</span>
              <span className="text-[11px] tracking-[0.12em] uppercase text-warm-400 mt-3 font-medium">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Marquee */}
      <div className="py-5 overflow-hidden border-y border-black/10 bg-ink">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-white/60 px-10">
                <span className="text-pop font-bold">Looking for:</span> <span className="text-white/90 font-medium">AI & Machine Learning</span> · Software Engineering · <span className="text-white/90 font-medium">Product & Design</span> · Blockchain & Web3 · <span className="text-white/90 font-medium">Research</span> · Founder · <span className="text-white/90 font-medium">Domain Innovators</span> · Remote Workers · <span className="text-white/90 font-medium">Startup</span> · Builder ·
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-pop" />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.about.label}</span>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg leading-relaxed text-warm-500 font-light max-w-[680px]"
        >
          <p>{t.about.prose1}</p>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="py-28 px-6 md:px-12 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-2.5 h-2.5 rounded-full bg-pop" />
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-400 font-medium">{lang === "it" ? "I nostri valori" : "Our values"}</span>
          </div>

          <div className="space-y-0">
            {t.about.cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="py-10 border-b border-black/5 first:border-t first:border-t-black/5 flex flex-col md:flex-row md:items-baseline gap-3 md:gap-10 group hover:bg-pop/[0.03] transition-colors px-4 -mx-4 rounded"
              >
                <span className="font-display text-3xl md:text-4xl font-bold text-pop leading-none shrink-0 md:w-[50px]">{String(idx + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight md:w-[260px] shrink-0 group-hover:text-pop transition-colors">
                  {card.title}
                </h3>
                <p className="text-base md:text-lg text-warm-500 leading-relaxed font-light max-w-[560px] pl-2 md:pl-0">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="bg-ink text-paper py-28 relative overflow-hidden">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-pop" />
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-300 font-medium">{t.community.label}</span>
          </div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-tight max-w-[750px] mb-16"
          >
            {t.community.title}
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 border border-white/10 rounded-lg overflow-hidden">
            {t.community.personas.map((persona, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 border-r border-white/5 last:border-r-0 relative group hover:bg-white/5 transition-all text-center"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-pop scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <span className="font-mono text-[8px] tracking-widest text-white/25 uppercase mb-6 block">{persona.idx}</span>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-pop" />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.space.label}</span>
        </div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1.08] tracking-tight max-w-[750px] mb-12"
        >
          {lang === "it" ? (
            <>Progettato per chi innova,<br /><span className="italic font-bold">insieme</span><span className="text-pop">.</span></>
          ) : (
            <>Designed for those who innovate,<br /><span className="italic font-bold">together</span><span className="text-pop">.</span></>
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
                src={SPACE_SLIDE_PATHS[currentSpaceImage]}
                alt="Traent Hub space"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 50) {
                    prevSpaceImage();
                  } else if (info.offset.x < -50) {
                    nextSpaceImage();
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            <div className="space-grid absolute inset-0 pointer-events-none" />

            {/* Slider Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <button 
                onClick={prevSpaceImage}
                className="w-10 h-10 rounded-full bg-paper/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-pop hover:text-paper transition-all pointer-events-auto"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSpaceImage}
                className="w-10 h-10 rounded-full bg-paper/80 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-pop hover:text-paper transition-all pointer-events-auto"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {SPACE_SLIDE_PATHS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSpaceImage(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${currentSpaceImage === idx ? 'bg-pop w-4' : 'bg-paper/50'}`}
                />
              ))}
            </div>

            <div className="absolute bottom-6 right-6 z-10 pointer-events-none hidden md:block">
              <div className="flex items-center gap-1.5">
                <div className="relative w-7 h-7">
                  <img src="/logo.png" alt="" className="w-full h-full object-contain opacity-40" referrerPolicy="no-referrer" />
                </div>
                <span className="font-sans font-semibold text-sm tracking-tight text-black/40 lowercase">
                  traent<span className="text-pop/50">.</span>hub
                </span>
              </div>
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
      <section id="manifesto" className="py-32 md:py-48 px-6 md:px-12 bg-ink relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-2.5 h-2.5 rounded-full bg-pop" />
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-300 font-medium">{t.manifesto.label}</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.2] tracking-tight text-paper/90">
              {t.manifesto.mainBlock.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {i === 1 ? <span className="text-pop italic">{line}</span> : line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <div id="contact" className="bg-cream border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 min-h-[500px]">
            <div className="py-24 md:pr-20 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-pop" />
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-400 font-medium">{t.location.label}</span>
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
                  <a href="#manifesto" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.manifesto}</a>
                  <a href="#contact" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">{t.nav.contact}</a>
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="font-mono text-[9px] tracking-[0.2em] uppercase text-warm-300 font-medium">{t.footer.cols.social}</h5>
                <div className="flex flex-col gap-2">
                  <a href="https://www.linkedin.com/company/traent-hub/" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">LinkedIn</a>
                  <a href="https://x.com/TraentHub" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">X</a>
                  <a href="https://github.com/TraentHub" target="_blank" className="text-sm text-warm-500 hover:text-ink transition-colors font-light">GitHub</a>
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
            <span>© 2026 Traent Hub · Borgo Stretto 3, Pisa</span>
            <div className="flex gap-4">
              <a href="https://www.linkedin.com/company/traent-hub/" target="_blank" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">Li</a>
              <a href="https://x.com/TraentHub" target="_blank" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">X</a>
              <a href="https://github.com/TraentHub" target="_blank" className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center font-mono hover:bg-ink hover:text-paper transition-all">Gh</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
