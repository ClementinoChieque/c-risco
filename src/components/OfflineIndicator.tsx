import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

export function OfflineIndicator() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast.success("Conexão restaurada", {
        description: "Sincronizando dados com o servidor...",
        icon: <Wifi className="h-4 w-4" />,
      });
    };
    const goOffline = () => {
      setOnline(false);
      toast.warning("Você está offline", {
        description: "A app continua funcionando. Alterações sincronizam quando voltar à rede.",
        icon: <WifiOff className="h-4 w-4" />,
      });
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300 backdrop-blur-md shadow-lg">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Modo offline</span>
    </div>
  );
}
