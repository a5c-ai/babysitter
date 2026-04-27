import { type VariantProps } from "class-variance-authority";
declare const buttonVariants: (props?: ({
    variant?: "default" | "primary" | "ghost" | "neon" | "outline" | "destructive" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
};
export declare function Button({ className, variant, size, asChild, loading, disabled, ...props }: ButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
