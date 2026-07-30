"use client";

import React, { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(!isDark);
    localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      title="Toggle dark mode"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}