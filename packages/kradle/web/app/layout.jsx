import './globals.css';
import { ThemeRuntime } from './components/shell/theme-runtime.jsx';

export const metadata = { title: 'a5c.ai Kradle Console', description: 'a5c.ai Kradle forge and delivery console.' };

const themeInitScript = `(function(){try{var stored=window.localStorage&&window.localStorage.getItem('kradle-theme');var theme=stored||'light';var resolved=theme==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(theme==='dark'?'dark':'light');document.documentElement.setAttribute('data-theme',resolved);document.documentElement.style.colorScheme=resolved;}catch(error){}})();`;

export default function RootLayout({ children }) {
  // Aegis Cogitator typography: the serif display + mono accent live entirely in
  // --font-display / --font-body / --font-mono (system serif + system mono stacks),
  // so no external font <link> is required. body inherits var(--font-body) from
  // globals.css. The data-theme/localStorage theme mechanism is unchanged.
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head><body><ThemeRuntime />{children}</body></html>;
}
