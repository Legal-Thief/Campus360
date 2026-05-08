import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: "checkmark-circle-outline", color: COLORS.success, bg: COLORS.successBg,  border: COLORS.successBorder },
  error:   { icon: "close-circle-outline",     color: COLORS.primary, bg: COLORS.primaryGlow, border: COLORS.primaryBorder },
  warning: { icon: "warning-outline",          color: COLORS.warning, bg: COLORS.warningBg,  border: COLORS.warningBorder },
  info:    { icon: "information-circle-outline",color: COLORS.textSecondary, bg: COLORS.white10, border: COLORS.border },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, []);

  const show = useCallback((msg: string, t: ToastType = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    setType(t);
    setVisible(true);
    translateY.setValue(-80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 140, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, 2800);
  }, [hide]);

  const cfg = TOAST_CONFIG[type];

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.toast,
            { top: insets.top + 12, transform: [{ translateY }], opacity },
            { borderColor: cfg.border, backgroundColor: COLORS.surface },
          ]}
        >
          <View style={[styles.toastAccent, { backgroundColor: cfg.color }]} />
          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
          <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
          <TouchableOpacity onPress={hide} style={styles.toastClose}>
            <Ionicons name="close" size={15} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    paddingRight: 10,
    zIndex: 9999,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: "hidden",
  },
  toastAccent: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 3,
  },
  toastText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONT.medium,
    lineHeight: 19,
  },
  toastClose: {
    padding: 4,
  },
});
