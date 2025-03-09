import React, { useEffect } from "react";

const GTranslate = () => {
  useEffect(() => {
    const addGoogleTranslateScript = () => {
      if (!document.querySelector("#google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en", // Default language
          includedLanguages: "en,hi,gu,mr,ta,fr,ja,de,ru,en,hi", // Add desired languages here
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };

    addGoogleTranslateScript();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 1000,
      }}
    >
      {/* Google Translate Element */}
      <div
        id="google_translate_element"
        style={{
          opacity: 0.8,
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "0.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "opacity 0.2s",
        }}
      ></div>

      {/* Black Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "black",
          opacity: 1, // Changed to 1 for full darkness (darker than 0.9)
          zIndex: 1,
          pointerEvents: "none",
          borderRadius: "8px",
        }}
      ></div>

      {/* Symbol Overlay */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)", // Centers the symbol
          zIndex: 2, // Above the black overlay
          pointerEvents: "none", // Ensures clicks pass through to the translate element
          color: "white", // White color for visibility against black background
          fontSize: "1.5rem", // Adjust size as needed
          fontWeight: "bold",
        }}
      >
        🌐 {/* Globe emoji as a simple symbol; replace with an icon or text as desired */}
      </div>
    </div>
  );
};

export default GTranslate;