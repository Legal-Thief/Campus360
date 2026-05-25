import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../utils/theme";

const { width } = Dimensions.get("window");

//  Types
type AlertType = "error" | "success" | "warning" | "info" | "confirm";

interface AlertConfig {
  type?: AlertType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  show: (config: AlertConfig) => void;
  confirm: (config: AlertConfig) => void;
  hide: () => void;
}

//  Context 
const AlertContext = createContext<AlertContextType>({
  show: () => {},
  confirm: () => {},
  hide: () => {},
});

export const useAlert = () => useContext(AlertContext);

//  Config per type
const TYPE_CONFIG: Record<AlertType, { icon: string; iconColor: string; accentColor: string; accentBg: string }> = {
  error:   { icon: "close-circle-outline",    iconColor: COLORS.primary,  accentColor: COLORS.primary,  accentBg: COLORS.primaryGlow },
  success: { icon: "checkmark-circle-outline", iconColor: COLORS.success,  accentColor: COLORS.success,  accentBg: COLORS.successBg },
  warning: { icon: "warning-outline",          iconColor: COLORS.warning,  accentColor: COLORS.warning,  accentBg: COLORS.warningBg },
  info:    { icon: "information-circle-outline",iconColor: COLORS.textMuted,accentColor: COLORS.textMuted,accentBg: COLORS.white10 },
  confirm: { icon: "alert-circle-outline",     iconColor: COLORS.warning,  accentColor: COLORS.warning,  accentBg: COLORS.warningBg },
};

//  Provider 
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig & { isConfirm?: boolean }>({ title: "" });
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => cb?.());
  };

  const show = useCallback((cfg: AlertConfig) => {
    scaleAnim.setValue(0.92);
    opacityAnim.setValue(0);
    setConfig({ ...cfg, isConfirm: false });
    setVisible(true);
    requestAnimationFrame(animateIn);
  }, []);

  const confirm = useCallback((cfg: AlertConfig) => {
    scaleAnim.setValue(0.92);
    opacityAnim.setValue(0);
    setConfig({ type: "confirm", ...cfg, isConfirm: true });
    setVisible(true);
    requestAnimationFrame(animateIn);
  }, []);

  const hide = useCallback(() => {
    animateOut(() => setVisible(false));
  }, []);

  const handleConfirm = () => {
    animateOut(() => {
      setVisible(false);
      config.onConfirm?.();
    });
  };

  const handleCancel = () => {
    animateOut(() => {
      setVisible(false);
      config.onCancel?.();
    });
  };

  const tc = TYPE_CONFIG[config.type || "info"];
  const isConfirm = config.isConfirm;

  return (
    <AlertContext.Provider value={{ show, confirm, hide }}>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={hide}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.sheet, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            {/* Top accent strip */}
            <View style={[styles.topStrip, { backgroundColor: tc.accentColor }]} />

            {/* Icon */}
            <View style={[styles.iconBox, { backgroundColor: tc.accentBg }]}>
              <Ionicons name={tc.icon as any} size={28} color={tc.iconColor} />
            </View>

            {/* Content */}
            <Text style={styles.title}>{config.title}</Text>
            {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Buttons */}
            <View style={[styles.btnRow, !isConfirm && styles.btnRowSingle]}>
              {isConfirm && (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>{config.cancelLabel || "Cancel"}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: tc.accentColor }, !isConfirm && styles.confirmBtnFull]}
                onPress={isConfirm ? handleConfirm : hide}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>{config.confirmLabel || (isConfirm ? "Confirm" : "OK")}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

//  Styles 
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  sheet: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 20,
  },
  topStrip: {
    width: "100%",
    height: 3,
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONT.bold,
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONT.regular,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 20,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
  btnRowSingle: {
    justifyContent: "center",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONT.semiBold,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.button,
    alignItems: "center",
  },
  confirmBtnFull: {
    flex: 0,
    minWidth: 140,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
