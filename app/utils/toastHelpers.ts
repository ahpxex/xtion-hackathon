import { ToastData } from '../store/atoms';

/**
 * 生成唯一的 toast ID
 */
function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 添加一个新的 toast 通知
 * @param toasts 当前的 toasts 数组
 * @param message 消息内容
 * @param type 消息类型
 * @param duration 显示时长（毫秒），默认 3000
 * @returns 包含新 toast 的数组和新 toast 的 id
 */
export function addToast(
  toasts: ToastData[],
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 3000
): { toasts: ToastData[]; id: string } {
  const id = generateToastId();
  const newToast: ToastData = {
    id,
    message,
    type,
    duration,
  };
  return {
    toasts: [...toasts, newToast],
    id,
  };
}

/**
 * 删除指定 id 的 toast
 * @param toasts 当前的 toasts 数组
 * @param id 要删除的 toast id
 * @returns 更新后的 toasts 数组
 */
export function removeToast(toasts: ToastData[], id: string): ToastData[] {
  return toasts.filter((toast) => toast.id !== id);
}

/**
 * 清空所有 toasts
 * @returns 空数组
 */
export function clearAllToasts(): ToastData[] {
  return [];
}

/**
 * 快捷方法：创建 info 类型的 toast
 */
export function createInfoToast(
  toasts: ToastData[],
  message: string,
  duration?: number
) {
  return addToast(toasts, message, 'info', duration);
}

/**
 * 快捷方法：创建 success 类型的 toast
 */
export function createSuccessToast(
  toasts: ToastData[],
  message: string,
  duration?: number
) {
  return addToast(toasts, message, 'success', duration);
}

/**
 * 快捷方法：创建 warning 类型的 toast
 */
export function createWarningToast(
  toasts: ToastData[],
  message: string,
  duration?: number
) {
  return addToast(toasts, message, 'warning', duration);
}

/**
 * 快捷方法：创建 error 类型的 toast
 */
export function createErrorToast(
  toasts: ToastData[],
  message: string,
  duration?: number
) {
  return addToast(toasts, message, 'error', duration);
}
