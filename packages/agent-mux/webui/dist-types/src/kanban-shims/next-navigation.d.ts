export declare function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (_href: string) => Promise<void>;
};
export declare function usePathname(): string;
export declare function useSearchParamsReadonly(): URLSearchParams;
export { useSearchParamsReadonly as useSearchParams };
