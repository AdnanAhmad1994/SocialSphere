import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-4 flex items-center gap-4">
      <p className="text-foreground">Theme Toggle:</p>
      <ThemeToggle />
    </div>
  );
}