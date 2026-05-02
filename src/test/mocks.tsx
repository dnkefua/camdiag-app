/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createElement } from 'react';
import { vi } from 'vitest';
import type { ComponentType, ReactNode, PropsWithChildren } from 'react';

/**
 * Comprehensive framer-motion mock used by component tests.
 * Returns a stand-in `motion` proxy that strips all animation props
 * and renders the underlying tag, plus stubs for hooks/components.
 */
export const createFramerMotionMock = () => {
  const stripAnimationProps = (props: Record<string, unknown>) => {
    const {
      animate, initial, exit, transition, whileHover, whileTap, whileInView, whileFocus,
      whileDrag, layout, layoutId, drag, dragConstraints, viewport, variants,
      onAnimationComplete, onAnimationStart, onUpdate, onDrag, onDragEnd, onDragStart,
      ...rest
    } = props;
    return rest;
  };

  const componentCache = new Map<string, ComponentType<PropsWithChildren<Record<string, unknown>>>>();

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, tag: string | symbol) {
      const tagName = typeof tag === 'string' ? tag : 'div';
      const cached = componentCache.get(tagName);
      if (cached) return cached;
      const Component = ({ children, ...rest }: PropsWithChildren<Record<string, unknown>>) =>
        createElement(tagName, stripAnimationProps(rest), children as ReactNode);
      componentCache.set(tagName, Component);
      return Component;
    },
  };

  const motion: any = new Proxy({}, handler);

  const motionValue = (initial: number) => ({
    get: () => initial,
    set: () => {},
    onChange: () => () => {},
    isMotionValue: true,
  });

  return {
    motion,
    AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
    useScroll: vi.fn(() => ({ scrollYProgress: motionValue(0), scrollY: motionValue(0) })),
    useTransform: vi.fn(() => motionValue(0)),
    useSpring: vi.fn((v) => v ?? motionValue(0)),
    useMotionValue: vi.fn((v) => motionValue(v ?? 0)),
    useInView: vi.fn(() => true),
    useAnimation: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  };
};
