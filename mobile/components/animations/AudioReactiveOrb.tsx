import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Shader,
  Fill,
  Skia,
  vec,
  Circle,
  RadialGradient,
  Group,
  Blur,
  BlendMode,
  Blend,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  useAnimatedProps,
  useFrameCallback,
  SharedValue,
} from 'react-native-reanimated';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'speaking';

interface AudioReactiveOrbProps {
  /** Audio intensity from microphone or Daily audio level (0-1) */
  intensity: SharedValue<number>;
  /** Current orb state */
  state: OrbState;
  /** Size of the orb (diameter) */
  size: number;
  /** Primary color from agent config (hex) */
  primaryColor?: string;
  /** Light/accent color from agent config (hex) */
  accentColor?: string;
}

// SkSL shader for the organic orb with Perlin noise displacement and Fresnel glow
const SHADER_SOURCE = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;
  uniform float iIntensity;
  uniform float iStateBlend; // 0 = idle/connecting, 1 = active (listening/speaking)
  uniform float3 iColor1;    // Primary color (RGB 0-1)
  uniform float3 iColor2;    // Accent color (RGB 0-1)

  // Simplex noise helpers
  float3 mod289(float3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  float2 mod289(float2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  float3 permute(float3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(float2 v) {
    const float4 C = float4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
    float2 i  = floor(v + dot(v, C.yy));
    float2 x0 = v - i + dot(i, C.xx);
    float2 i1;
    i1 = (x0.x > x0.y) ? float2(1.0, 0.0) : float2(0.0, 1.0);
    float4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    float3 p = permute(permute(i.y + float3(0.0, i1.y, 1.0))
                                    + i.x + float3(0.0, i1.x, 1.0));
    float3 m = max(0.5 - float3(dot(x0, x0), dot(x12.xy, x12.xy),
                                  dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    float3 x = 2.0 * fract(p * C.www) - 1.0;
    float3 h = abs(x) - 0.5;
    float3 ox = floor(x + 0.5);
    float3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    float3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;
    float2 center = float2(0.5, 0.5);
    float2 fromCenter = uv - center;
    float dist = length(fromCenter);

    // Base radius with gentle breathing
    float breathe = 0.008 * sin(iTime * 0.4);
    float baseRadius = 0.35 + breathe;

    // Noise displacement - more when speaking/listening
    float noiseStrength = 0.015 + iIntensity * 0.04 * iStateBlend;
    float angle = atan(fromCenter.y, fromCenter.x);
    // Low angular multipliers + slow time = gentle organic drift, not spinning
    float noise1 = snoise(float2(angle * 1.0 + iTime * 0.12, dist * 3.0 + iTime * 0.08));
    float noise2 = snoise(float2(angle * 1.5 - iTime * 0.10, dist * 4.0 - iTime * 0.06));
    float displacement = (noise1 * 0.6 + noise2 * 0.4) * noiseStrength;

    float radius = baseRadius + displacement;

    // Soft circle with smooth edge
    float edge = smoothstep(radius + 0.04, radius - 0.02, dist);

    // Fresnel rim glow (brighter at edges of the orb)
    float fresnel = 1.0 - smoothstep(radius * 0.3, radius, dist);
    float rimGlow = smoothstep(radius - 0.08, radius, dist) * edge;

    // Color mixing based on noise and intensity
    float colorMix = noise1 * 0.5 + 0.5;
    // Shift warmer when intensity is high
    colorMix = mix(colorMix, 1.0, iIntensity * 0.3 * iStateBlend);

    float3 baseColor = mix(iColor1, iColor2, colorMix);

    // Add warmth when speaking (shift toward amber/rose)
    float3 warmTint = float3(1.0, 0.85, 0.7);
    baseColor = mix(baseColor, warmTint, iIntensity * 0.15 * iStateBlend);

    // Inner glow (brighter center)
    float innerGlow = 1.0 - smoothstep(0.0, radius * 0.8, dist);
    baseColor += innerGlow * 0.15;

    // Rim light (Fresnel effect)
    float3 rimColor = mix(iColor2, float3(1.0, 1.0, 1.0), 0.5);
    baseColor = mix(baseColor, rimColor, rimGlow * (0.4 + iIntensity * 0.3));

    // Overall brightness boost when active
    float brightness = 1.0 + iIntensity * 0.2 * iStateBlend;
    baseColor *= brightness;

    // Outer glow (beyond orb edge)
    float outerGlow = smoothstep(radius + 0.15, radius, dist) * (1.0 - edge);
    float glowStrength = 0.15 + iIntensity * 0.25 * iStateBlend;
    float3 glowColor = mix(iColor1, iColor2, 0.5);

    float3 finalColor = baseColor * edge + glowColor * outerGlow * glowStrength;
    float finalAlpha = edge + outerGlow * glowStrength;

    return half4(half3(finalColor), half(finalAlpha));
  }
`)!;

// Parse hex color to RGB floats [0-1]
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [r, g, b];
}

export const AudioReactiveOrb: React.FC<AudioReactiveOrbProps> = ({
  intensity,
  state,
  size,
  primaryColor = '#8B7EC8',
  accentColor = '#6ED7C4',
}) => {
  const time = useSharedValue(0);

  // Animate time continuously
  useFrameCallback((info) => {
    time.value = (info.timeSinceFirstFrame ?? 0) / 1000;
  });

  // State blend: smoothly transition between idle and active states
  const stateBlend = useSharedValue(0);
  React.useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      stateBlend.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    } else {
      stateBlend.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }
  }, [state]);

  // Smoothed intensity for less jittery response
  const smoothIntensity = useDerivedValue(() => {
    return intensity.value;
  });

  const color1 = useMemo(() => hexToRgb(primaryColor), [primaryColor]);
  const color2 = useMemo(() => hexToRgb(accentColor), [accentColor]);

  // Shader uniforms
  const uniforms = useDerivedValue(() => ({
    iResolution: [size, size],
    iTime: time.value,
    iIntensity: smoothIntensity.value,
    iStateBlend: stateBlend.value,
    iColor1: color1,
    iColor2: color2,
  }));

  // Breathing scale animation for the whole container
  const breatheScale = useSharedValue(1);
  React.useEffect(() => {
    if (state === 'idle' || state === 'connecting') {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.97, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        ),
        -1,
        true,
      );
    } else {
      breatheScale.value = withSpring(1, { damping: 15 });
    }
  }, [state]);

  // Opacity: fade in on mount / connecting
  const opacity = useSharedValue(0);
  React.useEffect(() => {
    if (state === 'connecting') {
      opacity.value = withTiming(0.7, { duration: 800 });
    } else if (state === 'idle') {
      opacity.value = withTiming(0.5, { duration: 600 });
    } else {
      opacity.value = withTiming(1, { duration: 400 });
    }
  }, [state]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Canvas style={{ width: size, height: size }}>
        <Fill>
          <Shader source={SHADER_SOURCE} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </Animated.View>
  );
};
