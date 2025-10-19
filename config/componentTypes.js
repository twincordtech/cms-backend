/*
 * File: componentTypes.js
 * Description: Defines the configuration for all dynamic component types and their fields used in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const componentTypes = {
  Banner: {
    fields: [
      { 
        name: "title", 
        type: "string", 
        fieldType: "text",
        default: "Welcome to Our Website" 
      },
      { 
        name: "subtitle", 
        type: "string", 
        fieldType: "text",
        default: "We provide the best services" 
      },
      { 
        name: "backgroundImage", 
        type: "image", 
        fieldType: "image",
        default: "" 
      },
      { 
        name: "ctaText", 
        type: "string", 
        fieldType: "text",
        default: "Learn More" 
      },
      { 
        name: "ctaLink", 
        type: "string", 
        fieldType: "text",
        default: "/about" 
      },
      {
        name: "style",
        type: "string",
        fieldType: "select",
        options: ["fullscreen", "centered", "split", "video"],
        default: "centered"
      },
      {
        name: "overlayOpacity",
        type: "number",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.1
      }
    ],
  },
  About: {
    fields: [
      { 
        name: "heading", 
        type: "string", 
        fieldType: "text",
        default: "About Us" 
      },
      { 
        name: "content", 
        type: "richText", 
        fieldType: "richText",
        default: "We are a company that..." 
      },
      { 
        name: "image", 
        type: "image", 
        fieldType: "image",
        default: "" 
      },
    ],
  },
  Testimonials: {
    fields: [
      { 
        name: "title", 
        type: "string", 
        fieldType: "text",
        default: "What Our Clients Say" 
      },
      {
        name: "testimonials",
        type: "array",
        fieldType: "array",
        itemStructure: [
          { 
            name: "name", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "position", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "message", 
            type: "text", 
            fieldType: "textarea"
          },
          { 
            name: "image", 
            type: "image", 
            fieldType: "image"
          },
        ],
      },
    ],
  },
  Team: {
    fields: [
      { 
        name: "sectionTitle", 
        type: "string", 
        fieldType: "text",
        default: "Meet the Team" 
      },
      {
        name: "members",
        type: "array",
        fieldType: "array",
        itemStructure: [
          { 
            name: "name", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "role", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "photo", 
            type: "image", 
            fieldType: "image"
          },
          { 
            name: "bio", 
            type: "text", 
            fieldType: "textarea"
          },
        ],
      },
    ],
  },
  Services: {
    fields: [
      { 
        name: "title", 
        type: "string", 
        fieldType: "text",
        default: "Our Services" 
      },
      {
        name: "services",
        type: "array",
        fieldType: "array",
        itemStructure: [
          { 
            name: "icon", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "title", 
            type: "string", 
            fieldType: "text"
          },
          { 
            name: "description", 
            type: "text", 
            fieldType: "textarea"
          },
        ],
      },
    ],
  },
  Gallery: {
    fields: [
      { 
        name: "title", 
        type: "string", 
        fieldType: "text",
        default: "Our Work" 
      },
      {
        name: "images",
        type: "array",
        fieldType: "array",
        itemStructure: [
          { 
            name: "image", 
            type: "image", 
            fieldType: "image"
          }
        ],
      },
    ],
  },
  Pricing: {
    fields: [
      {
        name: "sectionTitle",
        type: "string",
        fieldType: "text",
        default: "Our Pricing Plans"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text",
        default: "Choose the plan that fits your needs"
      },
      {
        name: "plans",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "name",
            type: "string",
            fieldType: "text"
          },
          {
            name: "price",
            type: "number",
            fieldType: "number"
          },
          {
            name: "currency",
            type: "string",
            fieldType: "text",
            default: "$"
          },
          {
            name: "period",
            type: "string",
            fieldType: "text",
            default: "month"
          },
          {
            name: "features",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "text",
                type: "string",
                fieldType: "text"
              },
              {
                name: "included",
                type: "boolean",
                fieldType: "boolean",
                default: true
              }
            ]
          },
          {
            name: "isPopular",
            type: "boolean",
            fieldType: "boolean",
            default: false
          },
          {
            name: "ctaText",
            type: "string",
            fieldType: "text",
            default: "Get Started"
          },
          {
            name: "ctaLink",
            type: "string",
            fieldType: "text",
            default: "#"
          }
        ]
      }
    ]
  },
  Tabs: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Features"
      },
      {
        name: "tabs",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "content",
            type: "richText",
            fieldType: "richText"
          },
          {
            name: "icon",
            type: "string",
            fieldType: "text"
          },
          {
            name: "image",
            type: "image",
            fieldType: "image"
          }
        ]
      },
      {
        name: "style",
        type: "string",
        fieldType: "select",
        options: ["horizontal", "vertical", "pills"],
        default: "horizontal"
      }
    ]
  },
  Carousel: {
    fields: [
      {
        name: "slides",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "description",
            type: "text",
            fieldType: "textarea"
          },
          {
            name: "ctaText",
            type: "string",
            fieldType: "text"
          },
          {
            name: "ctaLink",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "settings",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "autoplay",
            type: "boolean",
            fieldType: "boolean",
            default: true
          },
          {
            name: "interval",
            type: "number",
            fieldType: "number",
            default: 5000
          },
          {
            name: "showArrows",
            type: "boolean",
            fieldType: "boolean",
            default: true
          },
          {
            name: "showDots",
            type: "boolean",
            fieldType: "boolean",
            default: true
          }
        ]
      }
    ]
  },
  Features: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Key Features"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text"
      },
      {
        name: "layout",
        type: "string",
        fieldType: "select",
        options: ["grid", "list", "alternating"],
        default: "grid"
      },
      {
        name: "features",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "icon",
            type: "string",
            fieldType: "text"
          },
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "description",
            type: "text",
            fieldType: "textarea"
          },
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          }
        ]
      }
    ]
  },
  FAQ: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Frequently Asked Questions"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text"
      },
      {
        name: "questions",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "question",
            type: "string",
            fieldType: "text"
          },
          {
            name: "answer",
            type: "richText",
            fieldType: "richText"
          },
          {
            name: "category",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "style",
        type: "string",
        fieldType: "select",
        options: ["accordion", "grid", "tabs"],
        default: "accordion"
      }
    ]
  },
  Stats: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Our Impact"
      },
      {
        name: "stats",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "value",
            type: "string",
            fieldType: "text"
          },
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "icon",
            type: "string",
            fieldType: "text"
          },
          {
            name: "prefix",
            type: "string",
            fieldType: "text"
          },
          {
            name: "suffix",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "layout",
        type: "string",
        fieldType: "select",
        options: ["grid", "bar", "circular"],
        default: "grid"
      }
    ]
  },
  ContactForm: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Contact Us"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text"
      },
      {
        name: "fields",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["text", "email", "tel", "textarea", "select"],
            default: "text"
          },
          {
            name: "required",
            type: "boolean",
            fieldType: "boolean",
            default: false
          },
          {
            name: "placeholder",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "submitText",
        type: "string",
        fieldType: "text",
        default: "Send Message"
      },
      {
        name: "successMessage",
        type: "string",
        fieldType: "text",
        default: "Thank you for your message!"
      }
    ]
  },
  Timeline: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Our Journey"
      },
      {
        name: "events",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "date",
            type: "string",
            fieldType: "text"
          },
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "description",
            type: "text",
            fieldType: "textarea"
          },
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "icon",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "style",
        type: "string",
        fieldType: "select",
        options: ["vertical", "horizontal", "alternating"],
        default: "vertical"
      }
    ]
  },
  CTASection: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Ready to Get Started?"
      },
      {
        name: "description",
        type: "text",
        fieldType: "textarea"
      },
      {
        name: "primaryButton",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "text",
            type: "string",
            fieldType: "text",
            default: "Get Started"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          },
          {
            name: "style",
            type: "string",
            fieldType: "select",
            options: ["solid", "outline", "link"],
            default: "solid"
          }
        ]
      },
      {
        name: "secondaryButton",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "text",
            type: "string",
            fieldType: "text"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          },
          {
            name: "style",
            type: "string",
            fieldType: "select",
            options: ["solid", "outline", "link"],
            default: "outline"
          }
        ]
      },
      {
        name: "background",
        type: "string",
        fieldType: "select",
        options: ["light", "dark", "gradient", "image"],
        default: "light"
      },
      {
        name: "backgroundImage",
        type: "image",
        fieldType: "image"
      }
    ]
  },
  Comparison: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Compare Plans"
      },
      {
        name: "items",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "name",
            type: "string",
            fieldType: "text"
          },
          {
            name: "features",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "feature",
                type: "string",
                fieldType: "text"
              },
              {
                name: "value",
                type: "string",
                fieldType: "text"
              },
              {
                name: "highlight",
                type: "boolean",
                fieldType: "boolean",
                default: false
              }
            ]
          }
        ]
      }
    ]
  },
  HeroSection: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Welcome to Our Platform"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text",
        default: "The best solution for your needs"
      },
      {
        name: "backgroundType",
        type: "string",
        fieldType: "select",
        options: ["image", "video", "gradient", "pattern"],
        default: "image"
      },
      {
        name: "backgroundMedia",
        type: "string",
        fieldType: "image",
        description: "Background image or video URL"
      },
      {
        name: "overlayOpacity",
        type: "number",
        fieldType: "number",
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.1
      },
      {
        name: "buttons",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "text",
            type: "string",
            fieldType: "text"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          },
          {
            name: "style",
            type: "string",
            fieldType: "select",
            options: ["primary", "secondary", "outline", "link"]
          }
        ]
      }
    ]
  },

  Navigation: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["standard", "sticky", "transparent", "mega-menu"],
        default: "standard"
      },
      {
        name: "logo",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "darkImage",
            type: "image",
            fieldType: "image",
            description: "Logo for dark mode"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text",
            default: "/"
          }
        ]
      },
      {
        name: "menuItems",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          },
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["link", "dropdown", "mega-menu"]
          },
          {
            name: "children",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "label",
                type: "string",
                fieldType: "text"
              },
              {
                name: "link",
                type: "string",
                fieldType: "text"
              },
              {
                name: "description",
                type: "string",
                fieldType: "text"
              },
              {
                name: "icon",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      },
      {
        name: "settings",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "showSearch",
            type: "boolean",
            fieldType: "boolean",
            default: true
          },
          {
            name: "showLanguage",
            type: "boolean",
            fieldType: "boolean",
            default: false
          },
          {
            name: "showAuth",
            type: "boolean",
            fieldType: "boolean",
            default: true
          }
        ]
      }
    ]
  },

  MegaMenu: {
    fields: [
      {
        name: "columns",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "items",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "label",
                type: "string",
                fieldType: "text"
              },
              {
                name: "link",
                type: "string",
                fieldType: "text"
              },
              {
                name: "icon",
                type: "string",
                fieldType: "text"
              },
              {
                name: "description",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      },
      {
        name: "featuredContent",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "description",
            type: "string",
            fieldType: "text"
          },
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          }
        ]
      }
    ]
  },

  SocialProof: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Trusted by Leading Companies"
      },
      {
        name: "logos",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "name",
            type: "string",
            fieldType: "text"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "style",
        type: "string",
        fieldType: "select",
        options: ["grid", "slider", "banner"],
        default: "slider"
      }
    ]
  },

  ProductTour: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "How It Works"
      },
      {
        name: "steps",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "description",
            type: "text",
            fieldType: "textarea"
          },
          {
            name: "image",
            type: "image",
            fieldType: "image"
          },
          {
            name: "video",
            type: "string",
            fieldType: "text"
          },
          {
            name: "features",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "text",
                type: "string",
                fieldType: "text"
              },
              {
                name: "icon",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      }
    ]
  },

  AppDownload: {
    fields: [
      {
        name: "title",
        type: "string",
        fieldType: "text",
        default: "Download Our App"
      },
      {
        name: "description",
        type: "text",
        fieldType: "textarea"
      },
      {
        name: "image",
        type: "image",
        fieldType: "image",
        description: "App screenshot or device mockup"
      },
      {
        name: "stores",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["apple", "google", "windows"]
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          },
          {
            name: "qrCode",
            type: "image",
            fieldType: "image"
          }
        ]
      }
    ]
  },

  Authentication: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["login", "signup", "reset-password"],
        default: "login"
      },
      {
        name: "logo",
        type: "image",
        fieldType: "image"
      },
      {
        name: "title",
        type: "string",
        fieldType: "text"
      },
      {
        name: "subtitle",
        type: "string",
        fieldType: "text"
      },
      {
        name: "socialLogin",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "provider",
            type: "string",
            fieldType: "select",
            options: ["google", "facebook", "apple", "github"]
          },
          {
            name: "enabled",
            type: "boolean",
            fieldType: "boolean",
            default: true
          }
        ]
      },
      {
        name: "fields",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["text", "email", "password", "tel"]
          },
          {
            name: "required",
            type: "boolean",
            fieldType: "boolean",
            default: true
          },
          {
            name: "validation",
            type: "object",
            fieldType: "object",
            fields: [
              {
                name: "pattern",
                type: "string",
                fieldType: "text"
              },
              {
                name: "message",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      }
    ]
  },

  Dashboard: {
    fields: [
      {
        name: "layout",
        type: "string",
        fieldType: "select",
        options: ["sidebar", "topbar", "combined"],
        default: "sidebar"
      },
      {
        name: "widgets",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["stats", "chart", "list", "calendar", "activity"]
          },
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "width",
            type: "string",
            fieldType: "select",
            options: ["full", "half", "third", "quarter"]
          },
          {
            name: "data",
            type: "object",
            fieldType: "object",
            fields: [
              {
                name: "source",
                type: "string",
                fieldType: "text"
              },
              {
                name: "refresh",
                type: "number",
                fieldType: "number",
                default: 300
              }
            ]
          }
        ]
      }
    ]
  },

  Footer: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["standard", "sticky", "minimal"],
        default: "standard"
      },
      {
        name: "logo",
        type: "image",
        fieldType: "image"
      },
      {
        name: "columns",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "title",
            type: "string",
            fieldType: "text"
          },
          {
            name: "links",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "label",
                type: "string",
                fieldType: "text"
              },
              {
                name: "url",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      },
      {
        name: "social",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "platform",
            type: "string",
            fieldType: "text"
          },
          {
            name: "url",
            type: "string",
            fieldType: "text"
          },
          {
            name: "icon",
            type: "string",
            fieldType: "text"
          }
        ]
      },
      {
        name: "bottomBar",
        type: "object",
        fieldType: "object",
        fields: [
          {
            name: "copyright",
            type: "string",
            fieldType: "text"
          },
          {
            name: "links",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "label",
                type: "string",
                fieldType: "text"
              },
              {
                name: "url",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      }
    ]
  },

  Modal: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["standard", "fullscreen", "sidebar"],
        default: "standard"
      },
      {
        name: "title",
        type: "string",
        fieldType: "text"
      },
      {
        name: "content",
        type: "richText",
        fieldType: "richText"
      },
      {
        name: "size",
        type: "string",
        fieldType: "select",
        options: ["small", "medium", "large"],
        default: "medium"
      },
      {
        name: "buttons",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "text",
            type: "string",
            fieldType: "text"
          },
          {
            name: "action",
            type: "string",
            fieldType: "text"
          },
          {
            name: "style",
            type: "string",
            fieldType: "select",
            options: ["primary", "secondary", "danger"]
          }
        ]
      }
    ]
  },

  ErrorPage: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["404", "500", "maintenance", "coming-soon"],
        default: "404"
      },
      {
        name: "title",
        type: "string",
        fieldType: "text"
      },
      {
        name: "message",
        type: "text",
        fieldType: "textarea"
      },
      {
        name: "image",
        type: "image",
        fieldType: "image"
      },
      {
        name: "actions",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "text",
            type: "string",
            fieldType: "text"
          },
          {
            name: "link",
            type: "string",
            fieldType: "text"
          }
        ]
      }
    ]
  },

  SearchBar: {
    fields: [
      {
        name: "type",
        type: "string",
        fieldType: "select",
        options: ["simple", "advanced", "global"],
        default: "simple"
      },
      {
        name: "placeholder",
        type: "string",
        fieldType: "text",
        default: "Search..."
      },
      {
        name: "filters",
        type: "array",
        fieldType: "array",
        itemStructure: [
          {
            name: "label",
            type: "string",
            fieldType: "text"
          },
          {
            name: "field",
            type: "string",
            fieldType: "text"
          },
          {
            name: "type",
            type: "string",
            fieldType: "select",
            options: ["text", "select", "date", "number"]
          },
          {
            name: "options",
            type: "array",
            fieldType: "array",
            itemStructure: [
              {
                name: "label",
                type: "string",
                fieldType: "text"
              },
              {
                name: "value",
                type: "string",
                fieldType: "text"
              }
            ]
          }
        ]
      }
    ]
  }
};

// Field type mapping for reference
const FIELD_TYPES = {
  text: 'Single line text input',
  textarea: 'Multi-line text input',
  richText: 'Rich text editor with formatting',
  number: 'Numeric input field',
  image: 'Image upload field',
  boolean: 'True/False toggle',
  date: 'Date picker',
  select: 'Dropdown selection with options',
  array: 'List of items with multiple fields',
  object: 'Nested object with fields'
};

module.exports = componentTypes;

// End of componentTypes.js
// Description: End of component types configuration file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.