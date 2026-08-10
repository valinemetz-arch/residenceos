type ToastType = "success" | "error";

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

function createToast({ title, message = "", duration = 3000 }: ToastOptions, type: ToastType) {
  if (typeof document === "undefined") return;

  let container = document.querySelector<HTMLDivElement>(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200 ${
    type === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : "border-red-200 bg-red-50 text-red-900"
  }`;

  toast.innerHTML = `<strong class="block font-semibold">${title}</strong>${
    message ? `<p class="mt-1 text-xs leading-5">${message}</p>` : ""
  }`;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("opacity-0");
    window.setTimeout(() => {
      toast.remove();
      if (!container?.hasChildNodes()) {
        container.remove();
      }
    }, 200);
  }, duration);
}

export const toast = {
  success: (title: string, message?: string) => createToast({ title, message }, "success"),
  error: (title: string, message?: string) => createToast({ title, message }, "error"),
};
