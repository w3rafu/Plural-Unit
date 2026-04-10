export type ToastVariant = 'default' | 'success' | 'error';

export type ToastInput = {
	title: string;
	description?: string;
	variant?: ToastVariant;
	duration?: number;
};

export type ToastRecord = ToastInput & {
	id: string;
	variant: ToastVariant;
	duration: number;
};

const DEFAULT_DURATION_MS = 3600;

class ToastStore {
	toasts = $state<ToastRecord[]>([]);
	private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

	push(input: ToastInput) {
		const id = crypto.randomUUID();
		const toast: ToastRecord = {
			id,
			title: input.title,
			description: input.description ?? '',
			variant: input.variant ?? 'default',
			duration: input.duration ?? DEFAULT_DURATION_MS
		};

		this.toasts = [...this.toasts, toast];
		this.scheduleDismiss(toast);
		return id;
	}

	dismiss(id: string) {
		const timeout = this.timeouts.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.timeouts.delete(id);
		}
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	private scheduleDismiss(toast: ToastRecord) {
		if (toast.duration <= 0) return;

		const timeout = setTimeout(() => {
			this.dismiss(toast.id);
		}, toast.duration);

		this.timeouts.set(toast.id, timeout);
	}
}

export const toastStore = new ToastStore();

export function toast(input: ToastInput) {
	return toastStore.push(input);
}
