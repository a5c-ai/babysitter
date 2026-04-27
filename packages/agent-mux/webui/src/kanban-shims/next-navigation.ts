import { useLocation, useNavigate, useSearchParams } from 'react-router-dom-v6';

export function useRouter(): {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (_href: string) => Promise<void>;
} {
  const navigate = useNavigate();
  return {
    push(href: string) {
      navigate(href);
    },
    replace(href: string) {
      navigate(href, { replace: true });
    },
    back() {
      navigate(-1);
    },
    forward() {
      navigate(1);
    },
    refresh() {
      navigate(0);
    },
    async prefetch() {},
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParamsReadonly(): URLSearchParams {
  return useSearchParams()[0];
}

export { useSearchParamsReadonly as useSearchParams };
