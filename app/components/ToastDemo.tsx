'use client';

import { useAtom } from 'jotai';
import { toastsAtom } from '../store/atoms';
import {
  createInfoToast,
  createSuccessToast,
  createWarningToast,
  createErrorToast,
} from '../utils/toastHelpers';

export default function ToastDemo() {
  const [, setToasts] = useAtom(toastsAtom);

  const showInfoToast = () => {
    setToasts((toasts) => createInfoToast(toasts, '这是一条信息提示').toasts);
  };

  const showSuccessToast = () => {
    setToasts((toasts) =>
      createSuccessToast(toasts, '操作成功完成').toasts
    );
  };

  const showWarningToast = () => {
    setToasts((toasts) =>
      createWarningToast(toasts, '请注意这个警告').toasts
    );
  };

  const showErrorToast = () => {
    setToasts((toasts) => createErrorToast(toasts, '发生了一个错误').toasts);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg mb-2">通知测试</h3>
      <button
        onClick={showInfoToast}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
      >
        Info 提示
      </button>
      <button
        onClick={showSuccessToast}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
      >
        Success 提示
      </button>
      <button
        onClick={showWarningToast}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
      >
        Warning 提示
      </button>
      <button
        onClick={showErrorToast}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
      >
        Error 提示
      </button>
    </div>
  );
}
