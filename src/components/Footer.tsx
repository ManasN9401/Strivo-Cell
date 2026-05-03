import Link from 'next/link'

const LINKS = {
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Support: [
    { label: 'Help Centre', href: '#' },
    { label: 'Account', href: '/settings' },
    { label: 'Watch Party FAQ', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Preferences', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-strivo-bg mt-20">
      <div className="max-w-content mx-auto px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xl font-black tracking-tighter mb-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-white text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              STRIVO
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              Premium streaming for film lovers. Available everywhere, always in 4K.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {heading}
              </p>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/60 hover:text-white text-sm transition-colors
                                 focus-visible:outline-none focus-visible:text-strivo-accent"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row
                        items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Strivo Cell. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Made with Next.js & Supabase |{' '}
            <a
              href="https://github.com/ManasN9401/Strivo-Cell"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Strivo Cell GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
