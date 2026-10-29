import { useState, type FormEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

type Language = "it" | "en";

type FieldName =
  | "email"
  | "altContact"
  | "firstName"
  | "lastName"
  | "linkedin"
  | "occupation"
  | "ai"
  | "projects"
  | "consent";

/** Same order as the fields appear on the page: used to focus the first invalid one. */
const FIELD_ORDER: FieldName[] = [
  "firstName",
  "lastName",
  "email",
  "altContact",
  "linkedin",
  "occupation",
  "ai",
  "projects",
  "consent",
];

type FormValues = Record<Exclude<FieldName, "consent">, string> & { consent: boolean };
type FormErrors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "error";

/**
 * Submissions are POSTed to a Google Apps Script web app that appends them to a
 * shared Google Sheet (see integrations/google-sheet/README.md).
 */
const APPLICATION_ENDPOINT = import.meta.env.VITE_APPLICATION_ENDPOINT as string | undefined;

const CONTACT_EMAIL = "contact@traenthub.com";
const MAX_LONG_TEXT = 1500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LINKEDIN_RE = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[^\s/?#]+\/?([?#].*)?$/i;

const EMPTY_VALUES: FormValues = {
  email: "",
  altContact: "",
  firstName: "",
  lastName: "",
  linkedin: "",
  occupation: "",
  ai: "",
  projects: "",
  consent: false,
};

const copy = {
  it: {
    fields: {
      email: { label: "Email", placeholder: "nome@esempio.com" },
      altContact: {
        label: "Altro contatto",
        placeholder: "@username Telegram, numero di telefono…",
        hint: "Facoltativo: un secondo modo per raggiungerti.",
      },
      firstName: { label: "Nome", placeholder: "Mario" },
      lastName: { label: "Cognome", placeholder: "Rossi" },
      linkedin: { label: "Profilo LinkedIn", placeholder: "https://www.linkedin.com/in/il-tuo-profilo" },
      occupation: {
        label: "Di cosa ti occupi?",
        placeholder: "Lavoro, studio, ricerca… raccontaci cosa fai nella vita.",
      },
      ai: {
        label: "Come usi l'AI?",
        placeholder: "Strumenti, flussi di lavoro, esperimenti: nel lavoro e fuori.",
      },
      projects: {
        label: "A quali progetti stai lavorando?",
        placeholder: "Anche idee in fase iniziale: cosa stai costruendo e a che punto sei.",
      },
    },
    consent: {
      before: "Ho letto l'",
      link: "informativa sulla privacy",
      after: " e acconsento al trattamento dei miei dati per valutare la candidatura.",
    },
    submit: "Invia candidatura",
    submitting: "Invio in corso…",
    success: {
      title: "Candidatura inviata.",
      body: "Grazie! Abbiamo ricevuto la tua application e ti contatteremo all'email che ci hai indicato.",
    },
    errors: {
      required: "Campo obbligatorio.",
      email: "Inserisci un indirizzo email valido.",
      linkedin: "Inserisci il link al tuo profilo LinkedIn (linkedin.com/in/…).",
      consent: "Per inviare la candidatura devi accettare l'informativa.",
      submit: `Qualcosa è andato storto. Riprova tra poco oppure scrivici a ${CONTACT_EMAIL}.`,
    },
    required: "Campi obbligatori tranne dove indicato.",
  },
  en: {
    fields: {
      email: { label: "Email", placeholder: "name@example.com" },
      altContact: {
        label: "Other contact",
        placeholder: "Telegram @username, phone number…",
        hint: "Optional: a second way to reach you.",
      },
      firstName: { label: "First name", placeholder: "Jane" },
      lastName: { label: "Last name", placeholder: "Doe" },
      linkedin: { label: "LinkedIn profile", placeholder: "https://www.linkedin.com/in/your-profile" },
      occupation: {
        label: "What do you do?",
        placeholder: "Work, studies, research… tell us what you do for a living.",
      },
      ai: {
        label: "How do you use AI?",
        placeholder: "Tools, workflows, experiments: at work and beyond.",
      },
      projects: {
        label: "What projects are you working on?",
        placeholder: "Early-stage ideas count too: what you're building and where you are.",
      },
    },
    consent: {
      before: "I have read the ",
      link: "privacy policy",
      after: " and consent to the processing of my data to evaluate my application.",
    },
    submit: "Send application",
    submitting: "Sending…",
    success: {
      title: "Application sent.",
      body: "Thank you! We've received your application and will contact you at the email you provided.",
    },
    errors: {
      required: "This field is required.",
      email: "Enter a valid email address.",
      linkedin: "Enter the link to your LinkedIn profile (linkedin.com/in/…).",
      consent: "You need to accept the privacy policy to send your application.",
      submit: `Something went wrong. Please try again shortly or write to us at ${CONTACT_EMAIL}.`,
    },
    required: "All fields are required unless marked otherwise.",
  },
} as const;

function normalizeLinkedin(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function validate(values: FormValues, lang: Language): FormErrors {
  const e = copy[lang].errors;
  const errors: FormErrors = {};

  if (!values.email.trim()) errors.email = e.required;
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = e.email;

  if (!values.firstName.trim()) errors.firstName = e.required;
  if (!values.lastName.trim()) errors.lastName = e.required;

  if (!values.linkedin.trim()) errors.linkedin = e.required;
  else if (!LINKEDIN_RE.test(values.linkedin.trim())) errors.linkedin = e.linkedin;

  if (!values.occupation.trim()) errors.occupation = e.required;
  if (!values.ai.trim()) errors.ai = e.required;
  if (!values.projects.trim()) errors.projects = e.required;

  if (!values.consent) errors.consent = e.consent;

  return errors;
}

const inputClass = (hasError: boolean) =>
  [
    "w-full rounded-lg border bg-white/60 px-4 py-3.5 text-[15px] font-light text-ink",
    "placeholder:text-warm-300 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-pop/15",
    hasError ? "border-pop focus:border-pop" : "border-black/15 focus:border-pop",
  ].join(" ");

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-mono text-[10px] tracking-[0.18em] uppercase text-warm-500 font-medium mb-2.5">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-[12px] text-warm-400 font-light">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[12px] text-pop font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export function ApplicationForm({
  lang,
  onOpenPrivacy,
}: {
  lang: Language;
  onOpenPrivacy: () => void;
}) {
  const t = copy[lang];
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  // Honeypot: real users never see or fill this field, bots usually do.
  const [honeypot, setHoneypot] = useState("");

  const setField = <K extends FieldName>(name: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const describedBy = (name: FieldName, hasHint = false) =>
    errors[name] ? `apply-${name}-error` : hasHint ? `apply-${name}-hint` : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validate(values, lang);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(`apply-${firstInvalid}`)?.focus();
      return;
    }

    // Silently drop bot submissions.
    if (honeypot) {
      setStatus("success");
      return;
    }

    if (!APPLICATION_ENDPOINT) {
      console.error("VITE_APPLICATION_ENDPOINT is not set: application cannot be submitted.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      // No custom headers on purpose: a text/plain POST is a "simple" request,
      // so Apps Script doesn't need to answer a CORS preflight.
      const response = await fetch(APPLICATION_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          email: values.email.trim(),
          altContact: values.altContact.trim(),
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          linkedin: normalizeLinkedin(values.linkedin),
          occupation: values.occupation.trim(),
          ai: values.ai.trim(),
          projects: values.projects.trim(),
          consent: values.consent,
          lang,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? `HTTP ${response.status}`);
      setStatus("success");
    } catch (error) {
      console.error("Application submission failed", error);
      setStatus("error");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="rounded-xl border border-black/10 bg-white/60 p-10 md:p-14 text-center"
        >
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-pop text-paper flex items-center justify-center">
            <Check size={26} />
          </div>
          <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">{t.success.title}</h3>
          <p className="text-base text-warm-500 leading-relaxed font-light max-w-md mx-auto">{t.success.body}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          noValidate
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-7"
        >
          <div className="grid sm:grid-cols-2 gap-7">
            <Field id="apply-firstName" label={t.fields.firstName.label} error={errors.firstName}>
              <input
                id="apply-firstName"
                type="text"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                placeholder={t.fields.firstName.placeholder}
                aria-invalid={!!errors.firstName}
                aria-describedby={describedBy("firstName")}
                className={inputClass(!!errors.firstName)}
              />
            </Field>
            <Field id="apply-lastName" label={t.fields.lastName.label} error={errors.lastName}>
              <input
                id="apply-lastName"
                type="text"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                placeholder={t.fields.lastName.placeholder}
                aria-invalid={!!errors.lastName}
                aria-describedby={describedBy("lastName")}
                className={inputClass(!!errors.lastName)}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-7">
            <Field id="apply-email" label={t.fields.email.label} error={errors.email}>
              <input
                id="apply-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder={t.fields.email.placeholder}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy("email")}
                className={inputClass(!!errors.email)}
              />
            </Field>
            <Field id="apply-altContact" label={t.fields.altContact.label} hint={t.fields.altContact.hint} error={errors.altContact}>
              <input
                id="apply-altContact"
                type="text"
                autoComplete="off"
                value={values.altContact}
                onChange={(e) => setField("altContact", e.target.value)}
                placeholder={t.fields.altContact.placeholder}
                aria-describedby={describedBy("altContact", true)}
                className={inputClass(false)}
              />
            </Field>
          </div>

          <Field id="apply-linkedin" label={t.fields.linkedin.label} error={errors.linkedin}>
            <input
              id="apply-linkedin"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={values.linkedin}
              onChange={(e) => setField("linkedin", e.target.value)}
              placeholder={t.fields.linkedin.placeholder}
              aria-invalid={!!errors.linkedin}
              aria-describedby={describedBy("linkedin")}
              className={inputClass(!!errors.linkedin)}
            />
          </Field>

          {(["occupation", "ai", "projects"] as const).map((name) => (
            <Field key={name} id={`apply-${name}`} label={t.fields[name].label} error={errors[name]}>
              <textarea
                id={`apply-${name}`}
                rows={3}
                maxLength={MAX_LONG_TEXT}
                value={values[name]}
                onChange={(e) => setField(name, e.target.value)}
                placeholder={t.fields[name].placeholder}
                aria-invalid={!!errors[name]}
                aria-describedby={describedBy(name)}
                className={`${inputClass(!!errors[name])} resize-y leading-relaxed`}
              />
            </Field>
          ))}

          {/* Honeypot (hidden from people and assistive tech) */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="apply-company-website">Website</label>
            <input
              id="apply-company-website"
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-start gap-3">
              <input
                id="apply-consent"
                type="checkbox"
                checked={values.consent}
                onChange={(e) => setField("consent", e.target.checked)}
                aria-invalid={!!errors.consent}
                aria-describedby={describedBy("consent")}
                className="mt-1 w-4 h-4 shrink-0 accent-[#ff3d00] cursor-pointer"
              />
              <label htmlFor="apply-consent" className="text-[13px] text-warm-500 leading-relaxed font-light cursor-pointer">
                {t.consent.before}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="underline underline-offset-2 decoration-warm-300 hover:text-pop hover:decoration-pop transition-colors"
                >
                  {t.consent.link}
                </button>
                {t.consent.after}
              </label>
            </div>
            {errors.consent && (
              <p id="apply-consent-error" role="alert" className="mt-2 text-[12px] text-pop font-medium">
                {errors.consent}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="group inline-flex items-center gap-2.5 px-10 py-5 bg-ink text-paper text-[12px] font-semibold tracking-wider uppercase rounded-full hover:bg-pop hover:-translate-y-0.5 transition-all shadow-2xl shadow-pop/20 disabled:opacity-60 disabled:pointer-events-none"
            >
              {status === "submitting" ? (
                <>
                  {t.submitting}
                  <Loader2 size={18} className="animate-spin" />
                </>
              ) : (
                <>
                  {t.submit}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <span className="text-[12px] text-warm-400 font-light">{t.required}</span>
          </div>

          {status === "error" && (
            <p role="alert" className="text-[13px] text-pop font-medium">
              {t.errors.submit}
            </p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
