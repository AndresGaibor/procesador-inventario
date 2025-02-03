import { useState, useRef } from "react";
import { getCurrentWindow, WindowEvent } from "@tauri-apps/api/window";

function App() {
  // Obtén la ventana actual de Tauri
  const appWindow = getCurrentWindow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Referencias para almacenar el timer y la función para desuscribir el listener
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const listenerRef = useRef<() => void | null>(null);
  const closeListenerRef = useRef<() => void | null>(null);

  const startFullscreenTimer = async () => {
    // Poner la ventana en pantalla completa
    await appWindow.setFullscreen(true);
    setIsFullscreen(true);

    // Interceptar el cierre de la ventana y evitar que se cierre
    closeListenerRef.current = appWindow.onCloseRequested((event) => {
      event.preventDefault();
    });

    // Interceptar el evento de minimizar y restaurar la ventana si se minimiza
    listenerRef.current = await appWindow.onEvent((event: WindowEvent) => {
      if (event.event === "minimized") {
        // Si se minimiza, la restauramos inmediatamente
        appWindow.setMinimized(false);
      }
    });

    // Iniciar el contador (actualiza el estado cada segundo)
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Después de 10 segundos, permitir que la ventana se pueda minimizar y cerrar
    setTimeout(async () => {
      // Desuscribirse del listener de minimizar (si existe)
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
      // También puedes desuscribirte del listener de cierre si lo deseas
      if (closeListenerRef.current) {
        closeListenerRef.current();
        closeListenerRef.current = null;
      }
    }, 10000);
  };

  const stopTimer = async () => {
    // Limpiar el contador
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Salir del modo pantalla completa
    await appWindow.setFullscreen(false);
    setIsFullscreen(false);
    setSeconds(0);
  };

  // Función para formatear el tiempo en HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
      {!isFullscreen ? (
        <button
          onClick={startFullscreenTimer}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Iniciar Contador
        </button>
      ) : (
        <div className="text-center">
          <h1 className="text-8xl font-bold text-white mb-4">
            {formatTime(seconds)}
          </h1>
          <p className="text-xl text-gray-300">Tiempo transcurrido</p>
          {/* Puedes agregar un botón para detener el contador si lo deseas */}
          <button
            onClick={stopTimer}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Detener Contador
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
