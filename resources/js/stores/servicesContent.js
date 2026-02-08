const STORAGE_KEY = "rmty_services_content";

const DEFAULT_CONTENT = {
  hero: {
    titleLine1: "DESIGNING WITH",
    titleLine2: "INTENTIONS",
    paragraph:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia desunt mollitia animi, id est laborum et dolorum fuga.",
  },
  section: {
    heading: "RMTY Design\nArchitects",
    paragraph:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque",
    image: "/images/SAMPLE PIC.png",
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
    image: "/images/SOP.png",
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
