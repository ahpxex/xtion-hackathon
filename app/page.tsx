import NativeButton from "./components/NativeButton";
import CreditDisplay from "./components/CreditDisplay";
import Shop from "./components/Shop";
import FloatingPanel from "./components/FloatingPanel";
import ToastDemo from "./components/ToastDemo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col gap-6 justify-center items-center py-8">
      <CreditDisplay size="sm" />
      <NativeButton clickValue={1}>Native Button</NativeButton>
      <Shop />

      <FloatingPanel title="通知中心">
        <ToastDemo />
      </FloatingPanel>
    </div>
  );
}
