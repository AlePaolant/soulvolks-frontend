export default function Footer() {
  return (
    <footer className="bg-[var(--scuro)] mt-20">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          
          {/* Logo + tagline */}
          <div>
            <p className="font-droid text-[var(--panna-chiaro)] text-3xl leading-none mb-2">
              SOUL VOLKS
            </p>
            <p className="font-poppins text-xs text-[var(--panna-chiaro)]/30 uppercase tracking-widest">
              Original Ride · Est. 2023 · Molise
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <a href="mailto:info@soulvolks.it"
              className="font-poppins text-xs text-[var(--panna-chiaro)]/40 hover:text-[var(--panna-chiaro)] transition-colors uppercase tracking-widest">
              info@soulvolks.it
            </a>
            <a href="https://www.instagram.com/soul_volks/" target="_blank"
              className="font-poppins text-xs text-[var(--panna-chiaro)]/40 hover:text-[var(--panna-chiaro)] transition-colors uppercase tracking-widest">
              @soul_volks
            </a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-5">
            <a href="https://www.instagram.com/soul_volks/" target="_blank"
              className="text-[var(--panna-chiaro)]/30 hover:text-[var(--panna-chiaro)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61551862714633" target="_blank"
              className="text-[var(--panna-chiaro)]/30 hover:text-[var(--panna-chiaro)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@SoulVolks" target="_blank"
              className="text-[var(--panna-chiaro)]/30 hover:text-[var(--panna-chiaro)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#1b1713"/>
              </svg>
            </a>
            <a href="https://wa.me/+393277444827" target="_blank"
              className="text-[var(--panna-chiaro)]/30 hover:text-[var(--panna-chiaro)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.012a.75.75 0 0 0 .931.931l5.157-1.471A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.523-5.183-1.432l-.371-.221-3.841 1.096 1.096-3.841-.221-.371A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </a>
          </div>

        </div>

        <div className="border-t border-[var(--panna-chiaro)]/10 mt-8 pt-6 flex flex-col md:flex-row justify-between gap-2">
          <p className="font-poppins text-[10px] text-[var(--panna-chiaro)]/20 uppercase tracking-widest">
            © 2026 Soul Volks · Tutti i diritti riservati
          </p>
          <p className="font-poppins text-[10px] text-[var(--panna-chiaro)]/20 uppercase tracking-widest">
            Made by AP × Civico32 Studio
          </p>
        </div>

      </div>
    </footer>
  )
}