import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { packageStatusManager } from "../services/packageStatusManager";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const timeoutRefs = useRef(new Map());
  const notificationId = useRef(0);

  const isUserRole = () => {
    return userProfile && userProfile.role === "user";
  };

  const addNotification = (notification) => {
    const id = ++notificationId.current;
    const newNotification = {
      id,
      timestamp: Date.now(),
      autoHide: notification.autoHide !== false,
      duration: notification.duration || 5000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);
    setVisible(true);

    if (newNotification.autoHide) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);

      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      if (filtered.length === 0) {
        setVisible(false);
      }
      return filtered;
    });

    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  };

  const clearAllNotifications = () => {
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setNotifications([]);
    setVisible(false);
  };

  const showPackageOverdueNotification = (packages) => {
    if (!isUserRole()) return;

    const count = packages.length;
    const message =
      count === 1
        ? `Paket ${packages[0].periodData?.label} sudah dikembalikan!`
        : `${count} paket sudah dikembalikan!`;

    return addNotification({
      type: "error",
      title: "Paket Dikembalikan",
      message,
      icon: "⚠️",
      actions: [
        {
          label: "Lihat Detail",
          primary: true,
          onPress: () => {
            // Navigation akan di-handle di komponen yang menggunakan
          },
        },
      ],
      data: { packages, type: "overdue" },
    });
  };

  const showPackageUpcomingNotification = (packages) => {
    if (!isUserRole()) return;

    const count = packages.length;
    const message =
      count === 1
        ? `Paket ${packages[0].periodData?.label} akan segera dikirim dalam 3 hari`
        : `${count} paket akan segera dikirim dalam 3 hari`;

    return addNotification({
      type: "warning",
      title: "Paket Akan Dikirim",
      message,
      icon: "⏰",
      actions: [
        {
          label: "Lihat Detail",
          primary: true,
          onPress: () => {
            // Navigation akan di-handle di komponen yang menggunakan
          },
        },
      ],
      data: { packages, type: "upcoming" },
    });
  };

  const showPackageSuccessNotification = (packageData) => {
    if (!isUserRole()) return;

    return addNotification({
      type: "success",
      title: "Paket Berhasil Diambil",
      message: `Paket ${packageData.periodData?.label} telah berhasil diambil`,
      icon: "✅",
      duration: 3000,
      data: { packageData, type: "success" },
    });
  };

  const showUpdateNotification = (message, type = "info") => {
    if (!isUserRole()) return;

    return addNotification({
      type,
      title: "Status Diperbarui",
      message,
      icon: type === "success" ? "✅" : "ℹ️",
      duration: 3000,
    });
  };

  const showErrorNotification = (message, error = null) => {
    return addNotification({
      type: "error",
      title: "Error",
      message,
      icon: "❌",
      duration: 4000,
      data: { error },
    });
  };

  const showPriorityAppliedNotification = (priorityLevel, periodLabel) => {
    if (!isUserRole()) return;

    return addNotification({
      type: "success",
      title: "Prioritas Diterapkan",
      message: `Prioritas ${priorityLevel} berhasil diterapkan untuk ${periodLabel}`,
      icon: "💰",
      duration: 4000,
      data: { priorityLevel, periodLabel, type: "priority_applied" },
    });
  };

  const showPriorityStatusNotification = (newPriority) => {
    if (!isUserRole()) return;

    return addNotification({
      type: "info",
      title: "Status Prioritas Diperbarui",
      message: `Prioritas Anda sekarang: ${newPriority}`,
      icon: "💰",
      duration: 3000,
      data: { newPriority, type: "priority_updated" },
    });
  };

  const showPackageAccessNotification = (packageData, accessMethod) => {
    if (!isUserRole()) return;

    const message = `Paket ${packageData.periodData?.label} berhasil diakses via ${accessMethod}`;

    return addNotification({
      type: "success",
      title: "Akses Paket Berhasil",
      message,
      icon: "💳",
      duration: 4000,
      data: { packageData, accessMethod, type: "package_access" },
    });
  };

  const showGeneralNotification = (
    title,
    message,
    type = "info",
    options = {}
  ) => {
    return addNotification({
      type,
      title,
      message,
      icon:
        options.icon ||
        (type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"),
      duration: options.duration || 4000,
      actions: options.actions,
      data: options.data,
    });
  };

  useEffect(() => {
    const unsubscribe = packageStatusManager.addListener((type, data) => {
      if (!isUserRole()) return;

      switch (type) {
        case "packages_overdue":
          if (data.userId === userProfile?.id) {
            showPackageOverdueNotification(data.packages);
          }
          break;

        case "packages_upcoming":
          if (data.userId === userProfile?.id) {
            showPackageUpcomingNotification(data.packages);
          }
          break;

        case "user_package_updated":
          if (data.userId === userProfile?.id && data.source !== "manual") {
            showUpdateNotification(
              `Data paket diperbarui (${data.source})`,
              "success"
            );
          }
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, [userProfile?.id, userProfile?.role]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  // Generic showNotification function for convenience
  const showNotification = (message, type = "info", title = null) => {
    return showGeneralNotification(
      title || (type === "success" ? "Berhasil" : type === "error" ? "Error" : "Info"),
      message,
      type
    );
  };

  const value = {
    notifications,
    visible,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showPackageOverdueNotification,
    showPackageUpcomingNotification,
    showPackageSuccessNotification,
    showUpdateNotification,
    showErrorNotification,
    showGeneralNotification,
    showNotification,
    showPriorityAppliedNotification,
    showPriorityStatusNotification,
    showPackageAccessNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
