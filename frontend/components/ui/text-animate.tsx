"use client";

import { memo } from "react";
import {
  AnimatePresence,
  motion,
  type DOMMotionComponents,
  type MotionProps,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

type MotionElementType = Extract<keyof DOMMotionComponents, keyof typeof motionElements>;

interface TextAnimateProps extends Omit<MotionProps, "children"> {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  as?: MotionElementType;
  by?: AnimationType;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationVariant;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { delayChildren: 0, staggerChildren: 0.05 } },
};

const blurInUpItem: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { y: { duration: 0.3 }, opacity: { duration: 0.4 }, filter: { duration: 0.3 } },
  },
};

function TextAnimateBase({
  children,
  delay = 0,
  duration = 0.3,
  className,
  segmentClassName,
  as: Component = "p",
  startOnView = true,
  once = true,
  by = "word",
  animation = "blurInUp",
}: TextAnimateProps) {
  const MotionComponent = motionElements[Component];

  let segments: string[] = [];
  switch (by) {
    case "word":
      segments = children.split(/(\s+)/);
      break;
    case "character":
      segments = children.split("");
      break;
    default:
      segments = [children];
      break;
  }

  const itemVariants = animation === "blurInUp" ? blurInUpItem : blurInUpItem;

  return (
    <AnimatePresence mode="popLayout">
      <MotionComponent
        variants={{
          ...defaultContainerVariants,
          show: {
            ...defaultContainerVariants.show,
            transition: { delayChildren: delay, staggerChildren: duration / segments.length },
          },
        }}
        initial="hidden"
        whileInView={startOnView ? "show" : undefined}
        animate={startOnView ? undefined : "show"}
        className={cn("whitespace-pre-wrap", className)}
        viewport={{ once }}
      >
        {segments.map((segment, i) => (
          <motion.span
            key={`${by}-${segment}-${i}`}
            variants={itemVariants}
            className={cn("inline-block whitespace-pre", segmentClassName)}
          >
            {segment}
          </motion.span>
        ))}
      </MotionComponent>
    </AnimatePresence>
  );
}

export const TextAnimate = memo(TextAnimateBase);
