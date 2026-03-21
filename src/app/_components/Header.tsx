"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [{ label: "Home", href: "/" }];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link
          href="/"
          className="text-xl font-bold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-3xl">📚</span> TripTales
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-colors ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        {/* <div className="hidden md:flex items-center gap-4">
          <button className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors px-3 py-2">
            Sign In
          </button>
          <Link
            href="/"
            className="text-sm font-bold bg-primary text-primary-foreground rounded-full px-5 py-2 shadow-md hover:shadow-lg hover:opacity-90 transition-all"
          >
            Get Started
          </Link>
        </div> */}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* <div className="border-t pt-2 mt-2 space-y-2">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left px-4 py-2 rounded-lg text-foreground hover:bg-muted"
              >
                Sign In
              </button>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div> */}
          </div>
        </div>
      )}
    </header>
  );
}
