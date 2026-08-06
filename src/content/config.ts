// Astro content collections config
// Note: Keystatic manages the content, this file defines the collections for Astro's getCollection/getEntry

import { defineCollection, z } from 'astro:content';

// Team members collection
const team = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    teamGroup: z.enum(['leadership', 'coordinator', 'staff']).optional(),
    photoLibraryPath: z.string().optional(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    order: z.number().default(99),
    isLeadership: z.boolean().default(false),
  }),
});

// One weekday in a recurring schedule. Keystatic serializes its conditional
// checkbox field as { discriminant, value }; value is present only when checked.
const recurringDaySchema = z
  .object({
    discriminant: z.boolean(),
    value: z
      .object({
        start: z.string(),
        end: z.string(),
      })
      .nullish(),
  })
  .optional();

// Normalize an externally-provided link so it's always treated as an absolute
// URL. A value like "portal.climbtheknot.com/x" (no scheme) would otherwise be
// resolved relative to the current page, prepending the site URL to the href.
// Values that already have a scheme (https:, mailto:, tel:) or are
// protocol-relative ("//…") are left exactly as given.
function normalizeExternalUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) return trimmed;
  return `https://${trimmed}`;
}

// Events collection
const events = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    date: z.string().nullish().transform((v) => v ?? undefined),
    endDate: z.string().nullish().transform((v) => v ?? undefined),
    time: z.string().optional(),
    description: z.string().optional(),
    imageLibraryPath: z.string().nullish().transform((v) => v ?? undefined),
    image: z.string().nullish(),
    registrationLink: z.string().nullish().transform(normalizeExternalUrl),
    // Keystatic conditional: the "Has a Dedicated Event Page" checkbox is the
    // discriminant; when checked, `value` may carry a flyer image.
    eventPage: z
      .object({
        discriminant: z.boolean(),
        value: z
          .object({
            flyerLibraryPath: z.string().nullish(),
            flyer: z.string().nullish(),
          })
          .nullish(),
      })
      .optional(),
    isFeatured: z.boolean().default(false),
    // Keystatic conditional: the "Recurring Event" checkbox is the discriminant,
    // and the per-day schedule (value) only exists when it's checked. Each day is
    // itself { discriminant, value?: { start, end } } with times as 24h "HH:MM".
    recurring: z
      .object({
        discriminant: z.boolean(),
        value: z
          .object({
            monday: recurringDaySchema,
            tuesday: recurringDaySchema,
            wednesday: recurringDaySchema,
            thursday: recurringDaySchema,
            friday: recurringDaySchema,
            saturday: recurringDaySchema,
            sunday: recurringDaySchema,
          })
          .partial()
          .nullish(),
      })
      .optional(),
    address: z.string().optional(),
    competitionDivisions: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      buttons: z.array(z.object({
        text: z.string().optional(),
        url: z.string().nullish().transform(normalizeExternalUrl),
      })).optional(),
    })).optional(),
    schedule: z.array(z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      openByDefault: z.boolean().default(false),
    })).optional(),
    // Keystatic omits empty text fields from the JSON, so both are optional.
    faqItems: z.array(z.object({
      question: z.string().optional(),
      answer: z.string().optional(),
    })).optional(),
    merchandise: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.string().optional(),
      preorderLink: z.string().optional(),
    })).optional(),
  }),
});

// Policies collection (Rates & Policies accordion)
const policies = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    content: z.any(), // Keystatic document field
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    order: z.number().default(99),
  }),
});

// Products collection
const products = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    // Optional in Keystatic: a product can be added before its price is known.
    // Keystatic writes a blank text field as "", which Zod's .default() would
    // NOT catch (it only fires on undefined), so coerce empty/missing -> "none".
    price: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v : 'none')),
    description: z.string().optional(),
    imageLibraryPaths: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    category: z.enum(['apparel', 'essentials', 'top-rope-gear', 'climbing-shoes']).default('apparel'),
    inStock: z.boolean().default(true),
    order: z.number().default(99),
  }),
});

// Not Ready to Commit cards
const notReadyCards = defineCollection({
  type: 'data',
  schema: z.object({
    label: z.string(),
    description: z.string().optional(),
    buttonText: z.string(),
    buttonLink: z.string(),
    imageLibraryPath: z.string().nullish().transform((v) => v ?? undefined),
    image: z.string().nullish(),
    order: z.number().default(99),
  }),
});

// Image Library — the one collection that owns image files. `image` is set for
// files uploaded through the CMS; `filePath` points at files committed to the
// repo directly, which no entry owns.
const mediaAssets = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    category: z
      .enum([
        'home',
        'about',
        'new-climbers',
        'membership',
        'amenities',
        'events',
        'shop',
        'team',
        'global',
        'other',
      ])
      .default('other'),
    image: z.string().nullish(),
    filePath: z.string().nullish(),
    altText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

// Pages collection (singletons like home, about, membership, etc.)
const pages = defineCollection({
  type: 'data',
  schema: z.object({
    hero: z.object({
      headline: z.string().optional(),
      backgroundImage: z.string().optional(),
      backgroundImageLibraryPath: z.string().optional(),
      backgroundVideo: z.string().optional(),
      backgroundVideoLibraryPath: z.string().optional(),
      objectPositionX: z.number().optional(),
      objectPositionY: z.number().optional(),
      subtext: z.any().optional(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
    }).optional(),
    coreValuesHeadline: z.string().optional(),
    coreValues: z.array(z.object({
      title: z.string(),
      content: z.string().optional(),
    })).optional(),
    teamSections: z.object({
      ownersHeadline: z.string().optional(),
      coordinatorsHeadline: z.string().optional(),
      staffHeadline: z.string().optional(),
    }).optional(),
    faqHeadline: z.string().optional(),
    faqItems: z.array(z.object({
      title: z.string(),
      content: z.string().optional(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
      buttons: z.array(z.object({
        text: z.string().optional(),
        link: z.string().optional(),
      })).optional(),
      defaultOpen: z.boolean().optional(),
    })).optional(),
    // Other page-specific fields can be added as needed
    membership: z.any().optional(),
    notReadySection: z.any().optional(),
    ratesPoliciesHeadline: z.string().optional(),
    codeOfConduct: z.any().optional(),
    welcome: z.any().optional(),
    dayPass: z.any().optional(),
    activityCards: z.any().optional(),
    sectionHeadline: z.string().optional(),
    amenityCards: z.any().optional(),
    ctaButtons: z.any().optional(),
    gearStoreButton: z.any().optional(),
    intro: z.string().optional(),
    portalButton: z.any().optional(),
    pricing: z.any().optional(),
    benefits: z.any().optional(),
    benefitsImage: z.string().optional(),
  }).passthrough(),
});

// Custom pages collection — modular pages built from blocks via Keystatic.
// The blocks array is a discriminated list; we accept any discriminant and
// store value as a loose object since the rendering layer (BlockRenderer +
// per-block components) validates field access at the type/runtime boundary.
const customPages = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    seoDescription: z.string().optional(),
    isDraft: z.boolean().default(true),
    showInNav: z.boolean().default(false),
    navOrder: z.number().default(99),
    navLabel: z.string().optional(),
    blocks: z
      .array(
        z.object({
          discriminant: z.string(),
          value: z.any(),
        })
      )
      .default([]),
  }),
});

export const collections = {
  team,
  events,
  policies,
  products,
  'not-ready-cards': notReadyCards,
  'media-assets': mediaAssets,
  pages,
  'custom-pages': customPages,
};
