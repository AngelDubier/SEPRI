"use client";
import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/utils";

export function Button({
  borderRadius = "1rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration = 2000,
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children?: React.ReactNode;
  as?: any;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "bg-transparent relative p-[1px] overflow-hidden group",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: borderRadius }}
      >
        <MovingBorder duration={duration} borderRadius={borderRadius}>
          <div
            className={cn(
              "h-48 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle,#FFB000_0%,#ffffff_30%,transparent_70%)]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative border border-white/10 backdrop-blur-xl text-white flex items-center justify-center w-full h-full text-sm antialiased transition-colors duration-300",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 2000,
  borderRadius,
  ...otherProps
}: {
  children?: React.ReactNode;
  duration?: number;
  borderRadius?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<any>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    try {
      const length = pathRef.current?.getTotalLength();
      if (length && length > 0) {
        const pxPerMillisecond = length / duration;
        progress.set((time * pxPerMillisecond) % length);
      }
    } catch (e) {
      // Ignorar errores de medición inicial si el path está vacío
    }
  });

  const x = useTransform(
    progress,
    (val) => {
      try {
        return pathRef.current?.getPointAtLength(val).x || 0;
      } catch (e) {
        return 0;
      }
    }
  );
  const y = useTransform(
    progress,
    (val) => {
      try {
        return pathRef.current?.getPointAtLength(val).y || 0;
      } catch (e) {
        return 0;
      }
    }
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={borderRadius}
          ry={borderRadius}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};