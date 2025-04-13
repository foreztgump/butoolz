"use client"

import React, { useState, useEffect, useRef } from "react"
import { Cookies } from "react-cookie-consent" // Only import Cookies helper
import { Button } from "@/components/ui/button"

// Declare Gtag type on window
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Helper function to set Google Consent Mode defaults
const setConsentDefaults = () => {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  })
  console.log("Consent defaults set.")
}

// Helper function to update Google Consent Mode
const updateConsent = (granted: boolean) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const consentState = {
      ad_storage: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
    }
    window.gtag("consent", "update", consentState)
    console.log("Consent updated:", consentState)
  } else {
    console.error("gtag function not found on window for consent update.")
  }
}

const COOKIE_NAME = "userConsent"
const BANNER_DELAY_MS = 4000; // 4 seconds

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false) // Start hidden
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const effectRan = useRef(false)

  useEffect(() => {
    // Prevent effect running twice in development strict mode
    if (effectRan.current) {
      console.log("[Debug] Effect ran already, skipping.")
      return
    }
    effectRan.current = true // Mark effect logic as run

    console.log("[Debug] CookieConsentBanner effect running (unconditional delay test)...)")
    setConsentDefaults() // Set defaults regardless

    // Clear any existing timer just in case
    if (timerRef.current) {
      console.log("[Debug] Clearing existing timer.")
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // !!! TEMPORARY DEBUGGING: Remove cookie check and always schedule the banner !!!
    console.log(`[Debug] Unconditionally scheduling banner display in ${BANNER_DELAY_MS}ms.`)
    timerRef.current = setTimeout(() => {
      console.log("[Debug] Timer finished, showing banner.")
      setShowBanner(true)
      timerRef.current = null // Clear ref after timer fires
    }, BANNER_DELAY_MS)

    // Cleanup function
    return () => {
      console.log("[Debug] CookieConsentBanner cleanup running...")
      if (timerRef.current) {
        console.log("[Debug] Clearing timer in cleanup.")
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, []) // Keep empty dependency array

  const handleAccept = () => {
    // Restore original logic later if needed
    updateConsent(true)
    Cookies.set(COOKIE_NAME, "true", { expires: 150 })
    setShowBanner(false)
  }

  const handleDecline = () => {
    // Restore original logic later if needed
    updateConsent(false)
    Cookies.set(COOKIE_NAME, "false", { expires: 150 })
    setShowBanner(false)
  }

  if (!showBanner) {
    // console.log("[Debug] Rendering null because showBanner is false.") // Uncomment if needed
    return null
  }
  // console.log("[Debug] Rendering banner because showBanner is true.") // Uncomment if needed

  // Render custom banner UI - Using brighter explicit dark colors
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie Consent Banner"
      // Brighter background and border
      className="dark fixed bottom-0 left-0 right-0 z-50 w-full p-4 bg-neutral-800 border-t border-neutral-600 flex items-center justify-between gap-4 animate-fade-in"
    >
      <p className="text-sm flex-grow text-neutral-200"> {/* Brighter text */}
        This website uses cookies to enhance the user experience and analyze
        website traffic. By clicking "Accept", you agree to our use of cookies.
      </p>
      <div className="flex flex-shrink-0 gap-2 items-center">
        {/* Brighter explicit button styles for dark theme */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecline}
          // Brighter outline-like dark theme styles
          className="bg-transparent border border-neutral-500 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100 focus-visible:ring-neutral-400"
        >
          Decline
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleAccept}
          // Brighter default-like dark theme styles (white button)
          className="bg-white text-black hover:bg-neutral-200 focus-visible:ring-white"
        >
          Accept
        </Button>
      </div>
    </div>
  )
}

export default CookieConsentBanner 