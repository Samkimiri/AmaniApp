import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ColorPalette } from "@/theme/colors";
import { useColors } from "@/context/ThemeContext";
import { fontFamily } from "@/theme/typography";
import {
  LineSpacing,
  ReaderFont,
  ReaderLayout,
  TextSize,
  updateReaderSettings,
  useReaderSettings,
} from "@/data/readerSettings";

const SIZES: { id: TextSize; label: string; px: number }[] = [
  { id: "small", label: "Small", px: 14 },
  { id: "medium", label: "Medium", px: 17 },
  { id: "large", label: "Large", px: 20 },
  { id: "xlarge", label: "X-Large", px: 24 },
];
const SPACINGS: { id: LineSpacing; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "comfortable", label: "Comfortable" },
  { id: "airy", label: "Airy" },
];
const FONTS: { id: ReaderFont; label: string }[] = [
  { id: "serif", label: "Serif" },
  { id: "sans", label: "Sans" },
];
const LAYOUTS: { id: ReaderLayout; label: string }[] = [
  { id: "verses", label: "Verses" },
  { id: "paragraph", label: "Paragraph" },
];

/** Reading-comfort controls for the reader: text size, line spacing, font
 * and layout. Changes apply live behind the sheet and are remembered. */
export function ReaderSettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const settings = useReaderSettings();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* A short scrim so the text behind stays visible while adjusting. */}
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close reading settings" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Reading settings</Text>

        <Text style={styles.label}>Text size</Text>
        <View style={styles.segmentRow}>
          {SIZES.map((s) => {
            const active = settings.textSize === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => updateReaderSettings({ textSize: s.id })}
                style={[styles.segment, active && styles.segmentActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Text size ${s.label}`}
              >
                <Text style={[styles.segmentText, { fontSize: s.px }, active && styles.segmentTextActive]}>Aa</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Line spacing</Text>
        <Choice options={SPACINGS} value={settings.lineSpacing} onChange={(lineSpacing) => updateReaderSettings({ lineSpacing })} styles={styles} name="Line spacing" />

        <Text style={styles.label}>Font</Text>
        <Choice options={FONTS} value={settings.font} onChange={(font) => updateReaderSettings({ font })} styles={styles} name="Font" />

        <Text style={styles.label}>Layout</Text>
        <Choice options={LAYOUTS} value={settings.layout} onChange={(layout) => updateReaderSettings({ layout })} styles={styles} name="Layout" />

        <Pressable style={styles.done} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  styles,
  name,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  styles: ReturnType<typeof makeStyles>;
  name: string;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${name} ${o.label}`}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scrim: { flex: 1, backgroundColor: colors.scrim },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 26,
    },
    grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },
    title: { fontFamily: fontFamily.serifBold, fontSize: 19, color: colors.textPrimary },
    label: {
      fontFamily: fontFamily.sansExtraBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 18,
      marginBottom: 8,
    },
    segmentRow: { flexDirection: "row", gap: 8 },
    segment: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentActive: { backgroundColor: colors.navy, borderColor: colors.navy },
    segmentText: { fontFamily: fontFamily.serifBold, fontSize: 13.5, color: colors.textPrimary },
    segmentTextActive: { color: colors.white },
    done: { marginTop: 22, height: 48, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
    doneText: { fontFamily: fontFamily.sansBold, fontSize: 14.5, color: colors.white },
  });
}
