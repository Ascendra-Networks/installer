import { io, Socket } from "socket.io-client";

const WS_URL = (import.meta as any).env?.VITE_WS_URL || "ws://localhost:3001";

let socket: Socket | null = null;

/**
 * Initialize WebSocket connection to the installer backend.
 * Idempotent: reuses existing connection if already open.
 */
export function initializeWebSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to backend");
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected from backend");
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });
  }

  return socket;
}

/**
 * Get the current WebSocket instance, or null if not initialized.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Close the WebSocket connection and clear the instance.
 */
export function closeWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}
