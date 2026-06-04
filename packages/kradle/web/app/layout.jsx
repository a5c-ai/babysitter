import './globals.css';
import { ThemeRuntime } from './components/shell/theme-runtime.jsx';

export const metadata = { title: 'a5c.ai Kradle Console', description: 'a5c.ai Kradle forge and delivery console.' };

const themeInitScript = `(function(){try{var stored=window.localStorage&&window.localStorage.getItem('kradle-theme');var theme=stored||'light';var resolved=theme==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(theme==='dark'?'dark':'light');document.documentElement.setAttribute('data-theme',resolved);document.documentElement.style.colorScheme=resolved;}catch(error){}})();`;

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" /><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head><body><ThemeRuntime />{children}</body></html>;
}
