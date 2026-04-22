const STORAGE_KEY = "rmty_services_content";

const DEFAULT_CONTENT = {
    hero: {
        titleLine1: "DESIGNING WITH",
        titleLine2: "INTENTIONS",
        paragraph:
            "RMTY delivers architecture and design services grounded in strategy, technical precision, and contextual thinking. We shape each solution around project goals, constraints, and long-term value.",
    },
    section: {
        heading: "RMTY Design\nArchitects",
        paragraph:
            "Our studio supports clients from concept design to construction documentation, ensuring that every decision is aligned with function, aesthetics, and buildability.",
        locationTag: "Tagaytay City",
    },
    services: [
        {
            title: "ARCHITECTURE",
            content:
                "We provide architectural design solutions that balance function, aesthetics, and buildability—from concept to construction-ready plans.",
        },
        {
            title: "INTERIORS/INTERIOR ARCHITECTURE",
            content:
                "Interior design and interior architecture services focused on spatial planning, finishes, lighting, and cohesive detailing.",
        },
        {
            title: "CONCEPTUAL PLANNING",
            content:
                "Early-stage planning to define project direction, massing, layout strategies, and key design decisions before development.",
        },
    ],
    cta: {
        linkText: "SEE OTHER PROJECTS",
        tag: "Architecture",
    },
};

export function getServicesContent() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Failed to load services content from storage", e);
    }
    return { ...JSON.parse(JSON.stringify(DEFAULT_CONTENT)) };
}

export function setServicesContent(content) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

export { DEFAULT_CONTENT };
