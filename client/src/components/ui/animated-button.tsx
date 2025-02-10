import React from 'react';
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md bg-[#0A0F1C]/80 px-4 py-2 text-[#f50] shadow-sm transition-all duration-300",
          "before:absolute before:inset-0 before:bg-[#f50]/5 before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-100",
          "after:absolute after:inset-0 after:rounded-md after:border after:border-[#f50]/20 after:transition-all hover:after:border-[#f50]/40",
          "hover:text-[#f50] hover:-translate-y-0.5",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };