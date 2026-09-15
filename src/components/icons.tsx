/**
 * Original line-icon set for Amani, drawn by hand as SVG path data.
 *
 * These are NOT sourced from any icon font or third-party icon library —
 * every path below was authored for this project, so there is no
 * attribution requirement and no licensing risk in shipping them.
 * Stroke-based, 24x24 viewBox, consistent 1.8-2.2 stroke width.
 */
import React from "react";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const base = (size = 22, strokeWidth = 1.9) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function OpenBookIcon({ size, color = "#1F3A5F", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M4 5.5c3-1.3 5.7-1.3 8 0v13c-2.3-1.3-5-1.3-8 0v-13Z" />
      <Path d="M20 5.5c-3-1.3-5.7-1.3-8 0v13c2.3-1.3 5-1.3 8 0v-13Z" />
    </Svg>
  );
}

export function HomeIcon({ size, color = "#A6AEB8", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M4 11.5 12 4l8 7.5" />
      <Path d="M6 10v9.5h12V10" />
    </Svg>
  );
}

export function NotesIcon({ size, color = "#A6AEB8", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={5} y={4} width={14} height={17} rx={1.5} />
      <Line x1={8.5} y1={9} x2={15.5} y2={9} />
      <Line x1={8.5} y1={13} x2={15.5} y2={13} />
      <Line x1={8.5} y1={17} x2={12.5} y2={17} />
    </Svg>
  );
}

export function UserIcon({ size, color = "#A6AEB8", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Circle cx={12} cy={8} r={3.5} />
      <Path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" />
    </Svg>
  );
}

export function PlusIcon({ size, color = "#FFFFFF", strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

export function ChevronRightIcon({ size, color = "#B9C4D3", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size, color = "#182233", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

export function ChevronDownIcon({ size, color = "#FFFFFF", strokeWidth = 2.6 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function CheckIcon({ size, color = "#FFFFFF", strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}

export function MicIcon({ size, color = "#5B6472", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M6 11a6 6 0 0 0 12 0" />
      <Line x1={12} y1={17} x2={12} y2={20} />
    </Svg>
  );
}

export function CameraIcon({ size, color = "#5B6472", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V8.5Z" />
      <Circle cx={12} cy={13} r={3.4} />
    </Svg>
  );
}

export function TagIcon({ size, color = "#5B6472", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M4 12 12 4h6a2 2 0 0 1 2 2v6l-8 8-8-8Z" />
      <Circle cx={15} cy={9} r={1.2} fill={color} stroke="none" />
    </Svg>
  );
}

export function SearchIcon({ size, color = "#9AA3AE", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Circle cx={11} cy={11} r={6.5} />
      <Line x1={20} y1={20} x2={16} y2={16} />
    </Svg>
  );
}

export function BookmarkIcon({ size, color = "#5B6472", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M6 3.5h9.5c.6 0 1 .4 1 1V20l-5.5-3-5.5 3V4.5c0-.6.4-1 1-1Z" />
    </Svg>
  );
}

export function HighlightIcon({ size, color = "#5B6472", strokeWidth }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M4 12 12 4h6a2 2 0 0 1 2 2v6l-8 8-8-8Z" />
    </Svg>
  );
}

export function ImagePlaceholderIcon({ size = 32, color = "#A9926A", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={3} y={4} width={18} height={16} rx={2} />
      <Circle cx={8.5} cy={9} r={1.6} />
      <Path d="M4 17l5-5 4 4 3-3 4 4" />
    </Svg>
  );
}

export function ShareArrowIcon({ size, color = "#5B6472", strokeWidth = 1.9 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Circle cx={18} cy={5} r={2.4} />
      <Circle cx={6} cy={12} r={2.4} />
      <Circle cx={18} cy={19} r={2.4} />
      <Line x1={8.1} y1={10.8} x2={15.9} y2={6.2} />
      <Line x1={8.1} y1={13.2} x2={15.9} y2={17.8} />
    </Svg>
  );
}

export function ImageCardIcon({ size = 20, color = "#8A5A00", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={3.5} y={5} width={17} height={14} rx={2} />
      <Circle cx={9} cy={10.5} r={1.6} />
      <Path d="M5 17l4.5-4.5L13 16l2.5-2.5L20 17.5" />
    </Svg>
  );
}

export function DocumentIcon({ size = 20, color = "#1F3A5F", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <Path d="M14 3.5V8h4" />
      <Line x1={8.5} y1={13} x2={15.5} y2={13} />
      <Line x1={8.5} y1={16.5} x2={15.5} y2={16.5} />
    </Svg>
  );
}

export function ClipboardIcon({ size = 20, color = "#1F3A5F", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={6} y={3.5} width={12} height={17} rx={2} />
      <Path d="M9.5 3.5v2.2h5V3.5" />
      <Line x1={9} y1={11} x2={15} y2={11} />
      <Line x1={9} y1={14.2} x2={15} y2={14.2} />
      <Line x1={9} y1={17.4} x2={12.5} y2={17.4} />
    </Svg>
  );
}

export function LinkIcon({ size = 20, color = "#1F3A5F", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M10 14a4.2 4.2 0 0 0 6 0l2.5-2.5a4.2 4.2 0 0 0-6-6L11 6.9" />
      <Path d="M14 10a4.2 4.2 0 0 0-6 0L5.5 12.5a4.2 4.2 0 0 0 6 6L13 17.1" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = "#5B6472", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Line x1={6} y1={6} x2={18} y2={18} />
      <Line x1={18} y1={6} x2={6} y2={18} />
    </Svg>
  );
}

export function TrashIcon({ size = 18, color = "#5B6472", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M5 7h14" />
      <Path d="M9 7V4.8c0-.4.3-.8.8-.8h4.4c.4 0 .8.3.8.8V7" />
      <Path d="M7 7l.8 12.2c0 .5.5.8 1 .8h6.4c.5 0 .9-.3 1-.8L17 7" />
      <Line x1={10} y1={10.5} x2={10} y2={16.5} />
      <Line x1={14} y1={10.5} x2={14} y2={16.5} />
    </Svg>
  );
}

export function LockIcon({ size = 20, color = "#1F3A5F", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Rect x={5.5} y={11} width={13} height={9.5} rx={2} />
      <Path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <Circle cx={12} cy={15.3} r={1.3} fill={color} stroke="none" />
    </Svg>
  );
}

export function BackspaceIcon({ size = 22, color = "#182233", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M9.5 5.5H19a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9.5L4 12l5.5-6.5Z" />
      <Line x1={11.5} y1={9.5} x2={16.5} y2={14.5} />
      <Line x1={16.5} y1={9.5} x2={11.5} y2={14.5} />
    </Svg>
  );
}

export function PlayIcon({ size = 18, color = "#FFFFFF", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color} fill={color}>
      <Path d="M7 5.5v13l11-6.5-11-6.5Z" />
    </Svg>
  );
}

export function PauseIcon({ size = 18, color = "#FFFFFF", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color} fill={color}>
      <Rect x={6.5} y={5} width={4} height={14} rx={1} />
      <Rect x={13.5} y={5} width={4} height={14} rx={1} />
    </Svg>
  );
}

export function StopIcon({ size = 16, color = "#FFFFFF", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color} fill={color}>
      <Rect x={5.5} y={5.5} width={13} height={13} rx={2.5} />
    </Svg>
  );
}

export function DownloadIcon({ size = 20, color = "#1F3A5F", strokeWidth = 1.9 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Path d="M12 4v11" />
      <Path d="M7.5 11 12 15.5 16.5 11" />
      <Path d="M5 17.5h14" />
    </Svg>
  );
}

export function WaveformIcon({ size = 18, color = "#5B6472", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size, strokeWidth)} stroke={color}>
      <Line x1={3} y1={12} x2={3} y2={12} />
      <Line x1={6} y1={8} x2={6} y2={16} />
      <Line x1={9.5} y1={4.5} x2={9.5} y2={19.5} />
      <Line x1={13} y1={9} x2={13} y2={15} />
      <Line x1={16.5} y1={6} x2={16.5} y2={18} />
      <Line x1={20} y1={10} x2={20} y2={14} />
    </Svg>
  );
}
