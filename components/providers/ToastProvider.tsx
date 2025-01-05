import {
  ToastProvider as Provider,
  ToastViewport,
} from "@/components/ui/toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <ToastViewport />
    </Provider>
  );
}
