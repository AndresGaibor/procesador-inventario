import { useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

function App() {
  const appWindow = getCurrentWindow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Usamos number para el timer (en browser, setInterval devuelve number)
  const timerRef = useRef<number | null>(null);
  // Usamos state para almacenar las funciones de cancelación de los listeners
  const [minimizeUnsub, setMinimizeUnsub] = useState<(() => void) | null>(null);
  const [closeUnsub, setCloseUnsub] = useState<(() => void) | null>(null);

  const startFullscreenTimer = async () => {
    // Poner la ventana en pantalla completa
    await appWindow.setFullscreen(true);
    setIsFullscreen(true);

    // Interceptar el cierre de la ventana
    // onCloseRequested sigue estando disponible en el objeto Window.
    // Suponiendo que retorna una función para cancelar el listener.
    const unsubClose = appWindow.onCloseRequested((event: any) => {
      event.preventDefault();
    });
    setCloseUnsub(() => unsubClose);

    // Suscribirse al evento de minimización usando `listen` del módulo de eventos.
    // El nombre del evento para la minimización puede variar; en muchos casos se usa "tauri://window-minimize".
    const unsubMinimize = await listen("tauri://window-minimize", () => {
      // Cuando se minimice, restauramos la ventana usando unminimize()
      appWindow.unminimize();
    });

    setMinimizeUnsub(() => unsubMinimize);

    // Iniciar el contador
    const timer = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    timerRef.current = timer;

    // Después de 10 segundos, se desuscriben los listeners para permitir comportamiento normal
    setTimeout(() => {
      if (minimizeUnsub) {
        minimizeUnsub();
        setMinimizeUnsub(null);
      }
      if (closeUnsub) {
        closeUnsub();
        setCloseUnsub(null);
      }
    }, 10000);
  };

  // Función para detener el contador y salir del modo pantalla completa
  const stopTimer = async () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
