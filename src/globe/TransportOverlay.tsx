import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TRANSPORT_EMOJI, type TransportType } from '../types';
import { TransportIcon, hasCustomIcon } from '../components/icons/TransportIcons';
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
/** Natural facing angle when using the emoji fallback. */
const EMOJI_NATURAL_ANGLE: Record<TransportType, number> = {
  plane: -45,
  car: 180,
  train: 180,
  boat: 0,
  walk: 0,
  bike: 0,
  other: 0,
};

/** Natural facing angle for custom SVG icons. */
const SVG_NATURAL_ANGLE: Partial<Record<TransportType, number>> = {
  plane: 0,   // faces right
  car: 0,     // faces right
  train: 180, // faces left
};

function getNaturalAngle(type: TransportType | undefined): number {
  const key = type ?? 'other';
  if (hasCustomIcon(key)) {
    return SVG_NATURAL_ANGLE[key] ?? 0;
  }
  return EMOJI_NATURAL_ANGLE[key] ?? 0;
}

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
  const [currentTransport, setCurrentTransport] = useState<TransportType | null>(null);

  useEffect(() => {
    let lastTransport: string | undefined;

    const interval = setInterval(() => {
      const data = overlayRef.current;
      if (!data) return;

      const view = viewRef.current;
      if (!view) return;

      if (data.visible) {
        const isCustom = data.transportType && hasCustomIcon(data.transportType as TransportType);
        const isPlane = data.transportType === 'plane' && isCustom;

        // Parabolic scale: 1.0 at edges, peaks at midpoint
        // sin(progress * PI) gives 0→1→0, scale it to go from baseScale to peakScale
        const baseScale = 1;
        const peakScale = 1.8;
        const isCar = data.transportType === 'car' && isCustom;
        let scaleBoost = 1;
        if (isPlane) {
          scaleBoost = baseScale + (peakScale - baseScale) * Math.sin(data.progress * Math.PI);
        } else if (isCar) {
          scaleBoost = 2;
        }

        const naturalAngle = getNaturalAngle(data.transportType as TransportType);
        let adjustedRotation = data.rotation - naturalAngle;

        // For custom icons: when traveling rightward (rotation roughly -90 to 90),
        // the icon would appear upside down. Flip vertically by using scaleY,
        // but only when needed based on the effective travel direction.
        let flipY = 1;
        if (isCustom) {
          // Normalize rotation to 0-360
          const norm = ((data.rotation % 360) + 360) % 360;
          // Traveling rightward: 0-90 or 270-360
          const goingRight = norm < 90 || norm > 270;
          // Right-facing SVGs (plane, car) need flip when going LEFT
          // Left-facing SVGs (train) need flip when going RIGHT
          const facesRight = naturalAngle === 0;
          if (facesRight ? !goingRight : goingRight) {
            flipY = -1;
          }
        }

        view.setNativeProps({
          style: {
            opacity: 1,
            transform: [
              { translateX: data.x - 16 },
              { translateY: data.y - 16 },
              { rotate: `${adjustedRotation}deg` },
              { scaleY: flipY },
              { scale: scaleBoost },
            ],
          },
        });
      } else {
        view.setNativeProps({ style: { opacity: 0 } });
      }

      if (data.transportType !== lastTransport) {
        lastTransport = data.transportType;
        const key = data.transportType as TransportType;
        setCurrentTransport(key ?? null);
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
      {currentTransport && hasCustomIcon(currentTransport) ? (
        <TransportIcon type={currentTransport} size={28} />
      ) : (
        <Text ref={textRef} style={styles.emoji}>
          {emoji}
        </Text>
      )}
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
