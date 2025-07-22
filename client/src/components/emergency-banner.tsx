import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function EmergencyBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">URGENT: Data Recovery Required</span>
            <span className="hidden sm:inline"> - Time entries from July 1-22 were lost. Re-enter your hours immediately.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/emergency-recovery">
            <Button variant="secondary" size="sm" className="bg-white text-red-600 hover:bg-gray-100">
              Recover Data
            </Button>
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}