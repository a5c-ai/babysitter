import './globals.css';
import { ThemeRuntime } from './components/theme-runtime.jsx';

export const metadata = { title: 'a5c.ai Krate Console', description: 'a5c.ai Krate forge and delivery console.' };

const themeInitScript = `(function(){try{var stored=window.localStorage&&window.localStorage.getItem('krate-theme');var theme=stored||'light';var resolved=theme==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(theme==='dark'?'dark':'light');document.documentElement.setAttribute('data-theme',resolved);document.documentElement.style.colorScheme=resolved;}catch(error){}})();`;

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head><body><ThemeRuntime />{children}</body></html>;
}
