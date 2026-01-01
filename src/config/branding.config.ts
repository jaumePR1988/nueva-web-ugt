/**
 * Branding Configuration
 * Use this file to customize the identity of each replicated portal.
 */

export const BRANDING = {
    companyName: "UGT Towa",
    shortName: "UGT",
    logoUrl: "/UGT-logo.jpg", // Path to the logo in the public folder
    primaryColor: "#dc2626",   // UGT Red
    secondaryColor: "#991b1b", // Corporate Dark Red
    accentColor: "#fef2f2",    // Light red background accent

    // Design Tokens (Solid Brand Identity)
    tokens: {
        borderRadius: "0.75rem",  // Professional institutional feel
        glassOpacity: "0.98",     // Nearly solid
        glassBlur: "4px",         // Minimal blur
        transitionSpeed: "0.2s",  // Snappy
        fontFamily: "'Inter', sans-serif"
    },

    // SEO & Social
    metaTitle: "Portal del Afiliado - UGT Towa",
    metaDescription: "Gestión de citas, comunicaciones y servicios para afiliados de UGT y trabajadores de Towa.",

    // Contact Info
    supportEmail: "soporte@ugt-towa.com",
    phone: "900 000 000",

    // Social Links
    links: {
        web: "https://www.ugt-towa.com",
        twitter: "https://twitter.com/ugttowa",
        facebook: "https://facebook.com/ugttowa"
    }
};
