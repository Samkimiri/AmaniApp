import React, { useEffect, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

/**
 * Motion primitives.
 *
 * The native driver can't drive layout/opacity work on web, so every
 * animation here switches it off there (`Platform.OS !== "web"`) rather
 * than warning at runtime. Both are deliberately small and quick — a tap
 * should feel like the surface responded, not like it performed.
 */

/** Spring easing shared by the press animations; snappy, barely overshoots. */
const SPRING = { speed: 40, bounciness: 3 } as const;

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far down to ease while held (1 = no movement). */
  scaleTo?: number;
}

/** A Pressable that eases in slightly while held — the tactile "give" that
 * makes a card or tile read as a real object instead of a rectangle. */
export function PressableScale({ children, style, scaleTo = 0.97, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const ease = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      ...SPRING,
      useNativeDriver: Platform.OS !== "web",
    }).start();

  return (
    <Pressable
      {...rest}
      onPressIn={(event: GestureResponderEvent) => {
        ease(scaleTo);
        rest.onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        ease(1);
        rest.onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export interface FadeInViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger successive list items by passing a small multiple. */
  delay?: number;
}

/** Fades and lifts its children into place once on mount. Used to let list
 * items settle in rather than appear all at once. */
export function FadeInView({ children, style, delay = 0 }: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A small dot that breathes while `active` and rests otherwise — the note
 * editor's save indicator, so "Saving…" reads as work in progress rather
 * than a static label. */
export function PulseDot({
  active,
  color,
  size = 6,
}: {
  active: boolean;
  color: string;
  size?: number;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 550, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <Animated.View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: pulse }}
    />
  );
}
