import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TRANSPORT_EMOJI, type TransportType } from '../types';
import type { SpriteOverlayData } from './TransportSprite';

/**
 * Each emoji has a natural facing direction (degrees, 0 = right).
 * We subtract this from the computed travel angle so the "front"
 * of the icon always points along the line.
 *
 * ✈️  points upper-right → ~315° (or -45°)
 * 🚗  faces left          → 180°
 * 🚆  faces left          → 180°
 * ⛵  faces right          → 0°
 * 🚶  faces right          → 0°
 * 🚲  faces right          → 0° (ish)
 * 📍  no direction         → 0°
 */
const EMOJI_NATURAL_ANGLE: Record<TransportType, number> = {
  plane: -45,
  car: 180,
  train: 180,
  boat: 0,
  walk: 0,
  bike: 0,
  other: 0,
};

interface TransportOverlayProps {
  overlayRef: React.RefObject<SpriteOverlayData>;
}

/**
 * React Native overlay that renders a transport emoji at the screen-space
 * position computed by TransportSprite inside the r3f canvas.
 *
 * Polls the shared ref at ~60fps via setInterval to stay in sync with
 * the useFrame loop without requiring React re-renders every frame.
 */
export function TransportOverlay({ overlayRef }: TransportOverlayProps) {
  const viewRef = useRef<View>(null);
  const textRef = useRef<Text>(null);
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    let lastTransport: string | undefined;

    const interval = setInterval(() => {
      const data = overlayRef.current;
      if (!data) return;

      const view = viewRef.current;
      if (!view) return;

      if (data.visible) {
        view.setNativeProps({
          style: {
            opacity: 1,
            transform: [
              { translateX: data.x - 16 },
              { translateY: data.y - 16 },
              { rotate: `${data.rotation - (EMOJI_NATURAL_ANGLE[(data.transportType as TransportType) ?? 'other'] ?? 0)}deg` },
            ],
          },
        });
      } else {
        view.setNativeProps({ style: { opacity: 0 } });
      }

      if (data.transportType !== lastTransport) {
        lastTransport = data.transportType;
        const key = data.transportType as keyof typeof TRANSPORT_EMOJI;
        setEmoji(key && TRANSPORT_EMOJI[key] ? TRANSPORT_EMOJI[key] : '📍');
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [overlayRef]);

  return (
    <View
      ref={viewRef}
      pointerEvents="none"
      style={styles.container}
    >
      <Text ref={textRef} style={styles.emoji}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  emoji: {
    fontSize: 24,
  },
});
