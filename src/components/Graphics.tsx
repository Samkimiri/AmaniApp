import React from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * Modern editorial vector illustrations & decorative graphics for Amani.
 * Built with react-native-svg so they render crisply at any resolution on
 * Web, iOS, and Android with zero network requests and full offline support.
 */

export function HeroSunburstGraphic({ width = 180, height = 110 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 180 110" fill="none">
      <Defs>
        <RadialGradient id="heroGlow" cx="75%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#D9B75C" stopOpacity={0.28} />
          <Stop offset="60%" stopColor="#D9B75C" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#D9B75C" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="archGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#D9B75C" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#1F3A5F" stopOpacity={0.08} />
        </LinearGradient>
      </Defs>
      <Circle cx={132} cy={40} r={66} fill="url(#heroGlow)" />
      {/* Sanctuary arch rings */}
      <Path
        d="M96 105V52a36 36 0 0 1 72 0v53"
        stroke="url(#archGrad)"
        strokeWidth={1.5}
      />
      <Path
        d="M108 105V52a24 24 0 0 1 48 0v53"
        stroke="#D9B75C"
        strokeOpacity={0.22}
        strokeWidth={1.2}
        strokeDasharray="3 4"
      />
      {/* Sunburst rays */}
      <Line x1={132} y1={10} x2={132} y2={2} stroke="#D9B75C" strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={156} y1={18} x2={163} y2={11} stroke="#D9B75C" strokeOpacity={0.3} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={108} y1={18} x2={101} y2={11} stroke="#D9B75C" strokeOpacity={0.3} strokeWidth={1.5} strokeLinecap="round" />
      {/* Warm gold sun disc & subtle stars */}
      <Circle cx={132} cy={46} r={10} fill="#D9B75C" fillOpacity={0.22} />
      <Circle cx={132} cy={46} r={4.5} fill="#D9B75C" fillOpacity={0.55} />
      <Path d="M74 28l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#D9B75C" fillOpacity={0.4} />
      <Circle cx={60} cy={56} r={2} fill="#1F3A5F" fillOpacity={0.18} />
    </Svg>
  );
}

/** Decorative watermark graphic for the Verse of the Day card */
export function VerseWatermarkGraphic({ size = 130 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 130 130" fill="none">
      <Circle cx={95} cy={35} r={58} stroke="#F0D68A" strokeOpacity={0.1} strokeWidth={1.5} />
      <Circle cx={95} cy={35} r={40} stroke="#F0D68A" strokeOpacity={0.12} strokeWidth={1.2} strokeDasharray="4 4" />
      <Path
        d="M65 95c14-7 26-7 36 0V48c-10-7-22-7-36 0v47Z"
        stroke="#F0D68A"
        strokeOpacity={0.12}
        strokeWidth={1.6}
      />
      <Path
        d="M137 95c-14-7-26-7-36 0V48c10-7 22-7 36 0v47Z"
        stroke="#F0D68A"
        strokeOpacity={0.12}
        strokeWidth={1.6}
      />
      <Path d="M42 26l2.2 5.5L50 33.7l-5.8 2.2L42 41.5l-2.2-5.6L34 33.7l5.8-2.2L42 26Z" fill="#F0D68A" fillOpacity={0.22} />
    </Svg>
  );
}

/** Thumbnail artwork for the "Discover Amani" video card on the Home screen */
export function VideoPreviewArtwork({ width = 112, height = 84 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 84" fill="none">
      <Defs>
        <LinearGradient id="thumbBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#16283F" />
          <Stop offset="100%" stopColor="#274B7A" />
        </LinearGradient>
        <RadialGradient id="thumbSpot" cx="50%" cy="45%" r="55%">
          <Stop offset="0%" stopColor="#F0D68A" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#F0D68A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={112} height={84} rx={12} fill="url(#thumbBg)" />
      <Circle cx={56} cy={38} r={42} fill="url(#thumbSpot)" />
      {/* Mini stylized notebook & Bible cards floating in background */}
      <G opacity={0.85}>
        <Rect x={14} y={16} width={38} height={50} rx={5} fill="#1F3A5F" stroke="#F0D68A" strokeOpacity={0.35} strokeWidth={1} />
        <Line x1={20} y1={25} x2={42} y2={25} stroke="#F0D68A" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
        <Line x1={20} y1={32} x2={45} y2={32} stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" />
        <Line x1={20} y1={38} x2={38} y2={38} stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" />
        <Rect x={20} y={44} width={25} height={12} rx={3} fill="#D9B75C" fillOpacity={0.25} />
      </G>
      <G opacity={0.9}>
        <Rect x={60} y={18} width={38} height={48} rx={5} fill="#1F3A5F" stroke="#F0D68A" strokeOpacity={0.35} strokeWidth={1} />
        {/* Waveform bars */}
        <Line x1={68} y1={32} x2={68} y2={42} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
        <Line x1={73} y1={27} x2={73} y2={47} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
        <Line x1={78} y1={30} x2={78} y2={44} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
        <Line x1={83} y1={25} x2={83} y2={49} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
        <Line x1={88} y1={33} x2={88} y2={41} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      </G>
      {/* Center glowing play button */}
      <Circle cx={56} cy={42} r={19} fill="#16283F" fillOpacity={0.75} stroke="#F0D68A" strokeWidth={1.5} />
      <Circle cx={56} cy={42} r={15} fill="#D9B75C" />
      <Path d="M52.5 36.2v11.6L62 42l-9.5-5.8Z" fill="#16283F" />
    </Svg>
  );
}

/** Scene 1 Illustration: Sanctuary Arch & Open Scripture with Light Rays */
export function SceneSanctuaryGraphic({ size = 210 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <Defs>
        <RadialGradient id="s1Glow" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#F0D68A" stopOpacity={0.42} />
          <Stop offset="65%" stopColor="#D9B75C" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#16283F" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="s1Arch" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F0D68A" stopOpacity={0.65} />
          <Stop offset="100%" stopColor="#6B93C4" stopOpacity={0.15} />
        </LinearGradient>
      </Defs>
      <Circle cx={110} cy={104} r={96} fill="url(#s1Glow)" />
      {/* Sanctuary Cathedral Arch */}
      <Path
        d="M54 176V96a56 56 0 0 1 112 0v80"
        stroke="url(#s1Arch)"
        strokeWidth={2}
      />
      <Path
        d="M68 176V96a42 42 0 0 1 84 0v80"
        stroke="#F0D68A"
        strokeOpacity={0.28}
        strokeWidth={1.2}
        strokeDasharray="4 4"
      />
      {/* Sun disc & rays */}
      <Circle cx={110} cy={72} r={16} fill="#F0D68A" fillOpacity={0.25} />
      <Circle cx={110} cy={72} r={8} fill="#F0D68A" />
      <Line x1={110} y1={42} x2={110} y2={30} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={134} y1={50} x2={143} y2={41} stroke="#F0D68A" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" />
      <Line x1={86} y1={50} x2={77} y2={41} stroke="#F0D68A" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" />
      {/* Open Illuminated Bible */}
      <Path
        d="M58 112c18-9 35-9 52 0v50c-17-9-34-9-52 0v-50Z"
        fill="#1F3A5F"
        stroke="#F0D68A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M162 112c-18-9-35-9-52 0v50c17-9 34-9 52 0v-50Z"
        fill="#1F3A5F"
        stroke="#F0D68A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Scripture lines on pages */}
      <Line x1={68} y1={124} x2={98} y2={124} stroke="#F0D68A" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" />
      <Line x1={68} y1={134} x2={100} y2={134} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={68} y1={143} x2={92} y2={143} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={120} y1={124} x2={150} y2={124} stroke="#F0D68A" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" />
      <Line x1={120} y1={134} x2={152} y2={134} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={120} y1={143} x2={144} y2={143} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.8} strokeLinecap="round" />
      {/* Gold bookmark ribbon */}
      <Path d="M110 162v22l6-5 6 5v-20" fill="#D9B75C" />
      {/* Sparkles */}
      <Path d="M42 74l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6Z" fill="#F0D68A" fillOpacity={0.65} />
      <Path d="M178 82l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2 2-4.5Z" fill="#F0D68A" fillOpacity={0.5} />
    </Svg>
  );
}

/** Scene 2 Illustration: Rich Sermon Note Editor with Verse Callout, Audio Waveform & Photo */
export function SceneNoteBlocksGraphic({ size = 210 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <Defs>
        <RadialGradient id="s2Glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6B93C4" stopOpacity={0.32} />
          <Stop offset="100%" stopColor="#16283F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={96} fill="url(#s2Glow)" />
      {/* Main Note Page Card */}
      <Rect
        x={44}
        y={26}
        width={132}
        height={168}
        rx={14}
        fill="#1C2838"
        stroke="#F0D68A"
        strokeOpacity={0.45}
        strokeWidth={1.8}
      />
      {/* Title & Metadata Pill */}
      <Line x1={60} y1={46} x2={136} y2={46} stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" />
      <Rect x={60} y={56} width={54} height={12} rx={6} fill="#D9B75C" fillOpacity={0.25} />
      <Circle cx={124} cy={62} r={3} fill="#3FA66A" />
      {/* Gold Verse Callout Block */}
      <Rect x={58} y={76} width={104} height={36} rx={7} fill="#2B2412" stroke="#D9B75C" strokeWidth={1.4} />
      <Rect x={58} y={76} width={4} height={36} rx={2} fill="#F0D68A" />
      <Line x1={68} y1={87} x2={146} y2={87} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={68} y1={96} x2={122} y2={96} stroke="#E3C077" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={68} y1={104} x2={96} y2={104} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      {/* Live Audio Recording Pill */}
      <Rect x={58} y={120} width={104} height={28} rx={8} fill="#24354C" stroke="#6B93C4" strokeOpacity={0.5} strokeWidth={1.2} />
      <Circle cx={72} cy={134} r={7} fill="#D9B75C" />
      <Path d="M70 130.5v7l5.5-3.5-5.5-3.5Z" fill="#16283F" />
      {/* Waveform inside audio block */}
      <Line x1={88} y1={130} x2={88} y2={138} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={95} y1={126} x2={95} y2={142} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={102} y1={128} x2={102} y2={140} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={109} y1={124} x2={109} y2={144} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={116} y1={129} x2={116} y2={139} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={123} y1={126} x2={123} y2={142} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      <Line x1={130} y1={131} x2={130} y2={137} stroke="#F0D68A" strokeWidth={2} strokeLinecap="round" />
      {/* Checklist rows */}
      <Circle cx={65} cy={162} r={5} fill="#3FA66A" />
      <Path d="m62.8 162 1.6 1.6 3.2-3.2" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={76} y1={162} x2={142} y2={162} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={65} cy={176} r={5} stroke="#6B93C4" strokeWidth={1.4} />
      <Line x1={76} y1={176} x2={128} y2={176} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
      {/* Floating Camera Snapshot Badge */}
      <G>
        <Rect x={144} y={138} width={44} height={38} rx={8} fill="#16283F" stroke="#F0D68A" strokeWidth={1.5} />
        <Circle cx={156} cy={150} r={3.5} fill="#F0D68A" />
        <Path d="M149 169l9-10 7 7 5-5 12 8" stroke="#6B93C4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

/** Scene 3 Illustration: Five Offline Bibles & Cross-Reference Constellation */
export function SceneBibleTranslationsGraphic({ size = 210 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <Defs>
        <RadialGradient id="s3Glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#D9B75C" stopOpacity={0.32} />
          <Stop offset="100%" stopColor="#16283F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={96} fill="url(#s3Glow)" />
      {/* Cross-reference connecting arcs */}
      <Path
        d="M54 90 Q110 34 166 90"
        stroke="#F0D68A"
        strokeOpacity={0.5}
        strokeWidth={1.6}
        strokeDasharray="4 4"
      />
      <Path
        d="M66 72 Q110 26 154 72"
        stroke="#6B93C4"
        strokeOpacity={0.5}
        strokeWidth={1.4}
      />
      {/* 5 Translation Stacked Cards / Pills */}
      <Rect x={34} y={54} width={36} height={22} rx={6} fill="#1F3A5F" stroke="#F0D68A" strokeWidth={1.5} />
      <Rect x={74} y={44} width={36} height={22} rx={6} fill="#D9B75C" />
      <Rect x={114} y={44} width={36} height={22} rx={6} fill="#1F3A5F" stroke="#F0D68A" strokeWidth={1.5} />
      <Rect x={152} y={54} width={36} height={22} rx={6} fill="#1F3A5F" stroke="#6B93C4" strokeWidth={1.5} />
      {/* Central Scripture Reader Card */}
      <Rect
        x={42}
        y={86}
        width={136}
        height={98}
        rx={14}
        fill="#1C2838"
        stroke="#F0D68A"
        strokeOpacity={0.5}
        strokeWidth={1.8}
      />
      {/* Highlighted Verse Row */}
      <Rect x={54} y={102} width={112} height={26} rx={6} fill="#D9B75C" fillOpacity={0.22} />
      <Line x1={62} y1={111} x2={154} y2={111} stroke="#F0D68A" strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={62} y1={120} x2={132} y2={120} stroke="#F0D68A" strokeOpacity={0.8} strokeWidth={2} strokeLinecap="round" />
      {/* Normal Verse Rows */}
      <Line x1={62} y1={140} x2={156} y2={140} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
      <Line x1={62} y1={150} x2={144} y2={150} stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
      <Line x1={62} y1={164} x2={118} y2={164} stroke="#6B93C4" strokeWidth={2} strokeLinecap="round" />
      {/* Magnifying Glass Badge */}
      <Circle cx={164} cy={164} r={20} fill="#16283F" stroke="#F0D68A" strokeWidth={2} />
      <Circle cx={162} cy={162} r={8} stroke="#F0D68A" strokeWidth={2} />
      <Line x1={168} y1={168} x2={175} y2={175} stroke="#F0D68A" strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

/** Scene 4 Illustration: Private Vault, Zero-Data-Loss Backup & Amani Link */
export function ScenePrivacyShieldGraphic({ size = 210 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <Defs>
        <RadialGradient id="s4Glow" cx="50%" cy="48%" r="50%">
          <Stop offset="0%" stopColor="#3FA66A" stopOpacity={0.28} />
          <Stop offset="60%" stopColor="#D9B75C" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#16283F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={96} fill="url(#s4Glow)" />
      {/* Outer orbit ring for Amani Link & Backup */}
      <Circle
        cx={110}
        cy={110}
        r={72}
        stroke="#F0D68A"
        strokeOpacity={0.3}
        strokeWidth={1.5}
        strokeDasharray="5 5"
      />
      {/* Shield Emblem */}
      <Path
        d="M110 44 60 66v42c0 34 21.4 63.6 50 74 28.6-10.4 50-40 50-74V66l-50-22Z"
        fill="#1C2838"
        stroke="#F0D68A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path
        d="M110 56 72 73v35c0 26.5 16.2 50 38 58.6 21.8-8.6 38-32.1 38-58.6V73l-38-17Z"
        fill="#1F3A5F"
        stroke="#6B93C4"
        strokeOpacity={0.4}
        strokeWidth={1.2}
      />
      {/* Lock icon inside shield */}
      <Rect x={94} y={104} width={32} height={24} rx={5} fill="#D9B75C" />
      <Path d="M100 104V95a10 10 0 0 1 20 0v9" stroke="#F0D68A" strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={110} cy={116} r={3} fill="#16283F" />
      {/* Checkmark badge */}
      <Circle cx={148} cy={64} r={14} fill="#3FA66A" stroke="#16283F" strokeWidth={2.5} />
      <Path d="m142.5 64 3.8 3.8 7.5-7.5" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

