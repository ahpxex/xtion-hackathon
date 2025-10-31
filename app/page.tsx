import NativeButton from './components/NativeButton';
import FancyButton from './components/FancyButton';

export default function Home() {
  return (
    <div className="h-screen flex flex-col gap-4 justify-center items-center">
      <NativeButton>Native Button</NativeButton>
      <FancyButton variant="primary">Fancy Primary</FancyButton>
      <FancyButton variant="secondary">Fancy Secondary</FancyButton>
      <FancyButton variant="accent">Fancy Accent</FancyButton>
    </div>
  );
}
