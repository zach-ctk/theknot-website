import { config, fields, collection, singleton } from '@keystatic/core';
import { createElement, Fragment, type FunctionComponent } from 'react';

const CMS_IMAGE_DIRECTORY = 'public/images/canva-final';
const CMS_IMAGE_PUBLIC_PATH = '/images/canva-final/';
const CMS_IMAGE_LIBRARY_PATTERN = 'public/images/canva-final/**/*.{jpg,jpeg,png,webp,avif,gif,svg}';
const CMS_VIDEO_LIBRARY_PATTERN = 'public/images/canva-final/**/*.{mp4,webm,mov,m4v}';
const CMS_MEDIA_LIBRARY_PATTERN =
  'public/images/canva-final/**/*.{jpg,jpeg,png,webp,avif,gif,svg,mp4,webm,mov,m4v,pdf}';

const BRAND_COLOR_OPTIONS = [
  { label: 'Rust (#B94237)', value: '#B94237' },
  { label: 'Limestone (#D0D96F)', value: '#D0D96F' },
  { label: 'Manatee (#84BABF)', value: '#84BABF' },
  { label: 'Coral (#D89B92)', value: '#D89B92' },
  { label: 'Surf (#0B4F6C)', value: '#0B4F6C' },
  { label: 'Deep Water (#073447)', value: '#073447' },
  { label: 'Milkweed (#F2F3AE)', value: '#F2F3AE' },
  { label: 'Graphite (#39393B)', value: '#39393B' },
  { label: 'Sand (#FAF9F5)', value: '#FAF9F5' },
  { label: 'Black (#000000)', value: '#000000' },
  { label: 'White (#FFFFFF)', value: '#FFFFFF' },
];

function colorPaletteField(label: string, defaultValue: string, description?: string) {
  return fields.select({
    label,
    options: BRAND_COLOR_OPTIONS,
    defaultValue,
    description,
  });
}

function imageLibraryField(label: string, description?: string) {
  return fields.pathReference({
    label,
    description,
    pattern: CMS_IMAGE_LIBRARY_PATTERN,
  });
}

function videoLibraryField(label: string, description?: string) {
  return fields.pathReference({
    label,
    description,
    pattern: CMS_VIDEO_LIBRARY_PATTERN,
  });
}

function objectPositionXField() {
  return fields.integer({
    label: 'Focal Point — Horizontal (%)',
    description:
      'Where on the image (left-to-right) the hero should anchor when cropped. 0 = far left edge, 50 = center, 100 = far right edge. Try 50 first; lower the number to keep more of the LEFT side visible, raise it to keep more of the RIGHT side visible.',
    defaultValue: 50,
    validation: { min: 0, max: 100 },
  });
}

function objectPositionYField() {
  return fields.integer({
    label: 'Focal Point — Vertical (%)',
    description:
      'Where on the image (top-to-bottom) the hero should anchor when cropped. 0 = very top edge, 50 = middle, 100 = very bottom edge. Try 50 first; lower the number to keep more of the TOP visible (good for faces/skylines), raise it to keep more of the BOTTOM visible (good for foregrounds).',
    defaultValue: 50,
    validation: { min: 0, max: 100 },
  });
}

// Size guidance appended to image/video field descriptions. These are the sizes
// to aim for; the hard ceiling that's actually enforced is MAX_UPLOAD_KB below.
const SIZE_GUIDANCE = {
  heroImage: 'Recommended: 1600–2400px wide, ≤ 800KB, JPG or WebP.',
  heroVideo: 'Recommended: 1280–1920px wide, ≤ 5MB, MP4 (H.264).',
  sectionImage: 'Recommended: 1000–1400px wide, ≤ 500KB.',
  cardImage: 'Recommended: 800–1200px wide, ≤ 300KB.',
  partnerLogo: 'Recommended: square crop, 400–600px, ≤ 100KB, JPG, PNG, or WebP.',
  pricingImage: 'Recommended: 800–1200px wide, ≤ 300KB.',
  teamPhoto: 'Recommended: 600–800px, square crop, ≤ 150KB.',
  eventImage: 'Recommended: 1000–1200px wide, ≤ 300KB.',
  productImage: 'Recommended: 1000–1200px wide, ≤ 300KB.',
} as const;

// Hard upload ceilings, enforced by imageUploadField. Set well above the
// SIZE_GUIDANCE targets on purpose: the job here is to stop a full-resolution
// camera original (10–20MB) from reaching the site, not to reject a reasonable
// export that lands a little over target. Raise or lower per slot as needed.
// Values are multiples of 1024 so they render as round numbers (2.5MB, not 2.4MB).
const MAX_UPLOAD_KB = {
  heroImage: 2560,
  sectionImage: 2048,
  cardImage: 1536,
  pricingImage: 1536,
  eventImage: 1536,
  productImage: 1536,
  teamPhoto: 1024,
  partnerLogo: 1024,
} as const;

type ImageKind = keyof typeof MAX_UPLOAD_KB;

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

// Keystatic's fields.image only validates `isRequired`, so a size limit has to be
// layered on top. Two halves, both needed: `validate` is what actually blocks the
// save, and `Input` renders the reason inline — Keystatic only console.warns
// validation errors, so without the message the save button would just fail
// silently and look broken.
function imageUploadField(label: string, kind: ImageKind, descriptionPrefix = '') {
  const maxBytes = MAX_UPLOAD_KB[kind] * 1024;
  const base = fields.image({
    label,
    description: `${descriptionPrefix}${SIZE_GUIDANCE[kind]} Files over ${formatBytes(maxBytes)} are rejected.`,
    directory: CMS_IMAGE_DIRECTORY,
    publicPath: CMS_IMAGE_PUBLIC_PATH,
  });

  type Value = Parameters<typeof base.validate>[0];
  type InputProps = Parameters<typeof base.Input>[0];
  const oversize = (value: Value) => !!value && value.data.byteLength > maxBytes;

  // Keystatic's types resolve against a nested @types/react@19 while this project
  // pins @types/react@18, so their ReactElement types are structurally
  // incompatible. There's a single React 18 at runtime (Keystatic peers on
  // ^18.2.0 || ^19.0.0), so these two casts are type-only bridges, not behaviour.
  const BaseInput = base.Input as unknown as FunctionComponent<InputProps>;

  return {
    ...base,
    Input(props: InputProps) {
      return createElement(
        Fragment,
        null,
        createElement(BaseInput, props),
        oversize(props.value)
          ? createElement(
              'div',
              {
                style: {
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #d64545',
                  background: '#fdeaea',
                  color: '#8b1f1f',
                  fontSize: 13,
                  lineHeight: 1.4,
                },
              },
              `This image is ${formatBytes(
                props.value!.data.byteLength
              )} — too large to publish (limit ${formatBytes(maxBytes)}). ${
                SIZE_GUIDANCE[kind]
              } Shrink it with a free tool like squoosh.app or tinypng.com, then upload again.`
            )
          : null
      ) as unknown as ReturnType<typeof base.Input>;
    },
    validate(value: Value) {
      if (oversize(value)) {
        throw new Error(
          `${label}: image is ${formatBytes(value!.data.byteLength)}, over the ${formatBytes(
            maxBytes
          )} limit.`
        );
      }
      return base.validate(value);
    },
  };
}

// 30-minute time slots covering a full day. Value is 24h "HH:MM" (stable, easy to
// sort/format); label is a friendly 12-hour string shown in the dropdown.
const TIME_SLOT_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour24 = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    label: `${hour12}:${pad(minute)} ${period}`,
    value: `${pad(hour24)}:${pad(minute)}`,
  };
});

// One conditional checkbox per weekday. When the day is checked, start/end time
// dropdowns (30-minute intervals) appear, keeping schedule formatting consistent
// across all events.
function recurringDayField(dayLabel: string) {
  return fields.conditional(
    fields.checkbox({ label: dayLabel, defaultValue: false }),
    {
      false: fields.empty(),
      true: fields.object({
        start: fields.select({
          label: 'Start Time',
          options: TIME_SLOT_OPTIONS,
          defaultValue: '17:00',
        }),
        end: fields.select({
          label: 'End Time',
          options: TIME_SLOT_OPTIONS,
          defaultValue: '20:00',
        }),
      }),
    }
  );
}

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
        kind: 'github',
        repo: 'Superdude22/theknot-website',
      }
      : {
        kind: 'local',
      },

  singletons: {
    // =========================================
    // BRAND SETTINGS
    // =========================================
    brand: singleton({
      label: 'Brand Settings',
      path: 'src/content/brand',
      format: { data: 'json' },
      schema: {
        colors: fields.object(
          {
            rust: colorPaletteField(
              'Rust (Primary)',
              '#B94237',
              'Primary brand color - used for primary buttons'
            ),
            limestone: colorPaletteField('Limestone', '#D0D96F', 'Bright accent color'),
            manatee: colorPaletteField(
              'Manatee (Secondary)',
              '#84BABF',
              'Secondary color - used for secondary buttons'
            ),
            coral: colorPaletteField('Coral', '#D89B92', 'Soft accent - Rust at 75%'),
            surf: colorPaletteField('Surf', '#0B4F6C', 'Deep blue'),
            deepWater: colorPaletteField('Deep Water', '#073447', 'Darkest blue'),
            milkweed: colorPaletteField('Milkweed', '#F2F3AE', 'Limestone at 50%'),
            graphite: colorPaletteField('Graphite', '#39393B', 'Dark neutral'),
            sand: colorPaletteField('Sand', '#FAF9F5', 'Light background'),
          },
          { label: 'Brand Colors' }
        ),
      },
    }),

    // =========================================
    // BUSINESS INFO
    // =========================================
    businessInfo: singleton({
      label: 'Business Info',
      path: 'src/content/business-info',
      format: { data: 'json' },
      schema: {
        contact: fields.object(
          {
            phone: fields.text({ label: 'Phone (Display)', defaultValue: '(352) 322-2402' }),
            phoneRaw: fields.text({
              label: 'Phone (Raw digits)',
              defaultValue: '3523222402',
              description: 'Used for tel: links',
            }),
            email: fields.text({ label: 'General Email', defaultValue: 'info@climbtheknot.com' }),
            eventsEmail: fields.text({
              label: 'Events Email',
              defaultValue: 'events@climbtheknot.com',
            }),
          },
          { label: 'Contact Information' }
        ),
        address: fields.object(
          {
            street: fields.text({ label: 'Street', defaultValue: '704 S Main St' }),
            city: fields.text({ label: 'City', defaultValue: 'Gainesville' }),
            state: fields.text({ label: 'State', defaultValue: 'FL' }),
            zip: fields.text({ label: 'ZIP Code', defaultValue: '32601' }),
          },
          { label: 'Address' }
        ),
        hours: fields.array(
          fields.object({
            days: fields.text({ label: 'Days' }),
            hours: fields.text({ label: 'Hours' }),
          }),
          {
            label: 'Hours of Operation',
            itemLabel: (props) => `${props.fields.days.value}: ${props.fields.hours.value}`,
          }
        ),
        social: fields.object(
          {
            instagramUrl: fields.text({
              label: 'Instagram URL',
              defaultValue: 'https://www.instagram.com/climbtheknot',
            }),
            facebookUrl: fields.text({
              label: 'Facebook URL',
              defaultValue: 'https://www.facebook.com/climbtheknot',
            }),
          },
          { label: 'Social Media' }
        ),
        portal: fields.object(
          {
            baseUrl: fields.text({
              label: 'Member Portal Base URL',
              defaultValue: 'https://portal.climbtheknot.com',
            }),
          },
          { label: 'Redpoint Portal' }
        ),
        gym: fields.object(
          {
            capacityMax: fields.integer({
              label: 'Max Capacity',
              defaultValue: 100,
            }),
            copyrightEntity: fields.text({
              label: 'Copyright Entity Name',
              defaultValue: 'The Knot - Climbing Gym',
            }),
          },
          { label: 'Gym Details' }
        ),
      },
    }),

    // =========================================
    // ANNOUNCEMENT BANNER
    // =========================================
    announcement: singleton({
      label: 'Announcement Banner',
      path: 'src/content/announcement',
      format: { data: 'json' },
      schema: {
        enabled: fields.checkbox({
          label: 'Show Banner',
          defaultValue: true,
        }),
        text: fields.text({
          label: 'Banner Text',
          defaultValue: 'Welcome to The Knot Climbing Gym!',
        }),
        linkText: fields.text({
          label: 'Link Text (optional)',
          description: 'Text for the clickable link portion',
        }),
        linkUrl: fields.text({
          label: 'Link URL (optional)',
          description: 'Where the link goes',
        }),
        backgroundColor: fields.select({
          label: 'Background Color',
          options: [
            { label: 'Rust (Primary)', value: 'rust' },
            { label: 'Manatee (Secondary)', value: 'manatee' },
            { label: 'Limestone', value: 'limestone' },
            { label: 'Graphite', value: 'graphite' },
          ],
          defaultValue: 'rust',
        }),
      },
    }),

    // =========================================
    // HOME PAGE
    // =========================================
    homePage: singleton({
      label: 'Home Page',
      path: 'src/content/pages/home',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({
              label: 'Headline',
              defaultValue: 'CLIMB. TRAIN. LEARN.',
            }),
            subtext: fields.array(
              fields.text({ label: 'Paragraph' }),
              {
                label: 'Subtext Paragraphs',
                itemLabel: (props) => props.value || 'Paragraph',
              }
            ),
            buttonText: fields.text({
              label: 'Button Text',
              defaultValue: 'START CLIMBING',
            }),
            buttonLink: fields.text({
              label: 'Button Link',
              defaultValue: '/new-climbers',
            }),
            backgroundVideo: fields.text({
              label: 'Background Video URL',
              description: 'Path to video file (e.g., /videos/hero.mp4)',
            }),
            backgroundVideoLibraryPath: videoLibraryField(
              'Background Video (Media Library)',
              `Select an existing video from the shared media library. ${SIZE_GUIDANCE.heroVideo}`
            ),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        membership: fields.object(
          {
            headline: fields.text({
              label: 'Section Headline',
              defaultValue: 'START YOUR MEMBERSHIP TODAY FOR',
            }),
            monthlyRate: fields.text({
              label: 'Monthly Rate Text',
              defaultValue: 'Then $80/month, billed on the first of every month.',
            }),
            description: fields.text({
              label: 'Description',
              multiline: true,
              defaultValue:
                'Only pay for the remaining days of this month, then cancel anytime with no contract or additional fees.',
            }),
            buttonText: fields.text({
              label: 'Button Text',
              defaultValue: 'JOIN NOW',
            }),
            buttonLink: fields.text({
              label: 'Button Link',
              defaultValue: 'https://portal.climbtheknot.com/gnv/memberships/join',
            }),
            imageLibraryPath: imageLibraryField(
              'Section Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
            ),
            image: imageUploadField('Upload New Section Image (optional)', 'sectionImage'),
          },
          { label: 'Membership Section' }
        ),
        notReadySection: fields.object(
          {
            headline: fields.text({
              label: 'Section Headline',
              defaultValue: 'NOT READY TO COMMIT? NO PROBLEM!',
            }),
          },
          { label: 'Not Ready to Commit Section' }
        ),
        ratesPoliciesHeadline: fields.text({
          label: 'Rates & Policies Headline',
          defaultValue: 'RATES & POLICIES',
        }),
        ratesPoliciesItems: fields.array(
          fields.object({
            title: fields.text({
              label: 'Item Title',
              defaultValue: 'BILLING & PAYMENTS',
            }),
            content: fields.text({
              label: 'Item Content',
              multiline: true,
              defaultValue:
                "Payments & billing changes processed on the 1st of each month.\n\nSubmit all change requests by the 25th to ensure they'll be processed before billing.",
            }),
            buttonText: fields.text({
              label: 'Button Text (optional)',
            }),
            buttonLink: fields.text({
              label: 'Button Link (optional)',
            }),
            order: fields.integer({
              label: 'Display Order',
              defaultValue: 99,
              description: 'Lower numbers appear first.',
            }),
          }),
          {
            label: 'Rates & Policies Items',
            itemLabel: () => 'Policy Item',
          }
        ),
        ctaSection: fields.object(
          {
            enabled: fields.checkbox({
              label: 'Show CTA Section',
              defaultValue: true,
            }),
            headline: fields.text({
              label: 'Headline',
              defaultValue: 'READY TO GET STARTED?',
            }),
            subtext: fields.text({
              label: 'Subtext',
              defaultValue: 'Join the climbing community today and start your journey.',
            }),
            buttons: fields.array(
              fields.object({
                text: fields.text({ label: 'Button Text' }),
                url: fields.text({ label: 'Button URL' }),
                style: fields.select({
                  label: 'Button Style',
                  options: [
                    { label: 'Blue (Primary)', value: 'blue' },
                    { label: 'Red (Secondary)', value: 'red' },
                  ],
                  defaultValue: 'blue',
                }),
              }),
              {
                label: 'CTA Buttons',
                itemLabel: (props) => props.fields.text.value || 'Button',
              }
            ),
          },
          { label: 'CTA Section ("Ready to Get Started?")' }
        ),
        codeOfConduct: fields.object(
          {
            headline: fields.text({
              label: 'Headline',
              defaultValue: 'CODE OF CONDUCT',
            }),
            paragraphs: fields.array(
              fields.text({ label: 'Paragraph', multiline: true }),
              {
                label: 'Content Paragraphs',
                itemLabel: (props) => props.value?.slice(0, 50) + '...' || 'Paragraph',
              }
            ),
          },
          { label: 'Code of Conduct Section' }
        ),
      },
    }),

    // =========================================
    // ABOUT PAGE
    // =========================================
    aboutPage: singleton({
      label: 'About Page',
      path: 'src/content/pages/about',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'ABOUT & FAQ' }),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        aboutIntro: fields.text({
          label: 'About Us Intro Paragraph',
          multiline: true,
          description: 'Introductory paragraph shown below the hero section.',
        }),
        coreValuesHeadline: fields.text({
          label: 'Core Values Headline',
          defaultValue: 'CORE VALUES',
        }),
        coreValues: fields.array(
          fields.object({
            title: fields.text({ label: 'Value Title' }),
            content: fields.text({ label: 'Content', multiline: true }),
          }),
          {
            label: 'Core Values',
            itemLabel: (props) => props.fields.title.value || 'Value',
          }
        ),
        meetTheTeamHeadline: fields.text({
          label: 'Meet The Team Headline',
          defaultValue: 'MEET THE TEAM',
        }),
        meetTheTeamIntro: fields.text({
          label: 'Meet The Team Intro Paragraph',
          multiline: true,
          description: 'Introductory text shown above the team sections.',
        }),
        teamSections: fields.object(
          {
            ownersHeadline: fields.text({
              label: 'Owners & Managers Headline',
              defaultValue: 'OWNERS & MANAGERS',
            }),
            coordinatorsHeadline: fields.text({
              label: 'Coordinators Headline',
              defaultValue: 'COORDINATORS',
            }),
            staffHeadline: fields.text({
              label: 'Staff Headline',
              defaultValue: 'DESK STAFF & INSTRUCTORS',
            }),
          },
          { label: 'Team Section Headings' }
        ),
        faqHeadline: fields.text({
          label: 'FAQ Headline',
          defaultValue: 'FREQUENTLY ASKED QUESTIONS',
        }),
        faqIntro: fields.text({
          label: 'FAQ Intro Text',
          multiline: true,
          description: 'Text shown below the FAQ headline (e.g., "Don\'t see your answer...")',
        }),
        faqItems: fields.array(
          fields.object({
            title: fields.text({ label: 'Question' }),
            content: fields.text({ label: 'Answer', multiline: true }),
            buttonText: fields.text({ label: 'Button Text (optional)' }),
            buttonLink: fields.text({ label: 'Button Link (optional)' }),
          }),
          {
            label: 'FAQ Items',
            itemLabel: (props) => props.fields.title.value || 'Question',
          }
        ),
        feedbackButtons: fields.array(
          fields.object({
            text: fields.text({ label: 'Button Text' }),
            url: fields.text({ label: 'Button URL' }),
          }),
          {
            label: 'Feedback Buttons',
            itemLabel: (props) => props.fields.text.value || 'Button',
          }
        ),
      },
    }),

    // =========================================
    // MEMBERSHIP PAGE
    // =========================================
    membershipPage: singleton({
      label: 'Membership Page',
      path: 'src/content/pages/membership',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'MEMBERSHIP' }),
            subtext: fields.text({ label: 'Subtext', multiline: true }),
            backgroundVideo: fields.text({
              label: 'Background Video URL',
              description: 'Path to video file (e.g., /images/canva-final/membership-hero.mp4)',
            }),
            backgroundVideoLibraryPath: videoLibraryField(
              'Background Video (Media Library)',
              `Select an existing video from the shared media library. ${SIZE_GUIDANCE.heroVideo}`
            ),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        manageSection: fields.object(
          {
            headline: fields.text({
              label: 'Section Headline',
              defaultValue: 'MANAGE YOUR MEMBERSHIP',
            }),
          },
          {
            label: 'Manage Membership Section',
            description: 'Body copy for this section comes from the Hero Subtext field.',
          }
        ),
        portalButton: fields.object(
          {
            text: fields.text({ label: 'Button Text', defaultValue: 'REDPOINT MEMBER PORTAL' }),
            url: fields.text({
              label: 'Button URL',
              defaultValue: 'https://portal.climbtheknot.com',
            }),
          },
          { label: 'Portal Button' }
        ),
        pricing: fields.object(
          {
            sectionHeading: fields.text({
              label: 'Section Headline',
              defaultValue: 'BILLING',
            }),
            headline: fields.text({
              label: 'Pricing Headline',
              description: 'Type $XX where the live prorated price should appear.',
              defaultValue: 'START YOUR MEMBERSHIP TODAY FOR ONLY $XX',
            }),
            billingText: fields.text({
              label: 'Billing/Prorate Text',
              multiline: true,
              description: 'Full paragraph about proration and billing details.',
            }),
            imageLibraryPath: imageLibraryField(
              'Manage Membership Section Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.pricingImage}`
            ),
            image: imageUploadField(
              'Upload New Manage Membership Section Image (optional)',
              'pricingImage'
            ),
          },
          { label: 'Billing Section' }
        ),
        benefits: fields.array(
          fields.object({
            title: fields.text({ label: 'Benefit Title' }),
            description: fields.text({ label: 'Description (optional)' }),
          }),
          {
            label: 'Member Benefits',
            itemLabel: (props) => props.fields.title.value || 'Benefit',
          }
        ),
        benefitsImageLibraryPath: imageLibraryField(
          'Benefits Section Image (Media Library)',
          `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
        ),
        benefitsImage: imageUploadField('Upload New Benefits Section Image (optional)', 'sectionImage'),
        localDiscounts: fields.object(
          {
            headline: fields.text({
              label: 'Section Headline',
              defaultValue: 'LOCAL DISCOUNTS',
            }),
            intro: fields.text({
              label: 'Intro Text',
              multiline: true,
              description: 'Paragraph shown below the headline.',
            }),
            partners15: fields.array(
              fields.object({
                name: fields.text({ label: 'Business Name' }),
                handle: fields.text({ label: 'Social Handle (optional)' }),
                description: fields.text({ label: 'Description (optional)', multiline: true }),
                address: fields.text({ label: 'Address (optional)' }),
                hours: fields.text({ label: 'Hours (optional)' }),
                image: imageUploadField('Logo / Photo (optional)', 'partnerLogo'),
              }),
              {
                label: '15% Off Partners',
                itemLabel: (props) => props.fields.name.value || 'Partner',
              }
            ),
            partners10: fields.array(
              fields.object({
                name: fields.text({ label: 'Business Name' }),
                handle: fields.text({ label: 'Social Handle (optional)' }),
                description: fields.text({ label: 'Description (optional)', multiline: true }),
                address: fields.text({ label: 'Address (optional)' }),
                hours: fields.text({ label: 'Hours (optional)' }),
                image: imageUploadField('Logo / Photo (optional)', 'partnerLogo'),
              }),
              {
                label: '10% Off Partners',
                itemLabel: (props) => props.fields.name.value || 'Partner',
              }
            ),
          },
          { label: 'Local Discounts Section' }
        ),
        bottomCta: fields.object(
          {
            headline: fields.text({
              label: 'Headline',
              description: 'Type $XX where the live prorated price should appear.',
              defaultValue: 'START YOUR MEMBERSHIP TODAY FOR $XX',
            }),
            description: fields.text({
              label: 'Description',
              multiline: true,
            }),
            buttonText: fields.text({
              label: 'Button Text',
              defaultValue: 'REDPOINT MEMBER PORTAL',
            }),
            buttonUrl: fields.text({
              label: 'Button URL',
              defaultValue: 'https://portal.climbtheknot.com',
            }),
          },
          { label: 'Bottom CTA Section' }
        ),
      },
    }),

    // =========================================
    // NEW CLIMBER PAGE
    // =========================================
    newClimberPage: singleton({
      label: 'New Climber Page',
      path: 'src/content/pages/new-climbers',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'NEW CLIMBERS' }),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        welcome: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'HI, WELCOME IN!' }),
            paragraphs: fields.array(
              fields.text({ label: 'Paragraph', multiline: true }),
              {
                label: 'Content Paragraphs',
                itemLabel: (props) => props.value?.slice(0, 50) + '...' || 'Paragraph',
              }
            ),
            imageLibraryPath: imageLibraryField(
              'Welcome Section Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
            ),
            image: imageUploadField('Upload New Welcome Section Image (optional)', 'sectionImage'),
          },
          { label: 'Welcome Section' }
        ),
        dayPass: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'DAY PASSES' }),
            price: fields.text({ label: 'Price', defaultValue: '$25' }),
            gearText: fields.text({ label: 'Gear Text', defaultValue: '+ GEAR' }),
            paragraphs: fields.array(
              fields.text({ label: 'Paragraph', multiline: true }),
              {
                label: 'Content Paragraphs',
                itemLabel: (props) => props.value?.slice(0, 50) + '...' || 'Paragraph',
              }
            ),
            hoursTitle: fields.text({
              label: 'Hours Section Title',
              defaultValue: 'DAY PASS HOURS',
            }),
            hoursText: fields.array(
              fields.text({ label: 'Hours Info', multiline: true }),
              {
                label: 'Hours Information',
                itemLabel: (props) => props.value?.slice(0, 50) + '...' || 'Info',
              }
            ),
            imageLibraryPath: imageLibraryField(
              'Day Pass Section Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
            ),
            image: imageUploadField('Upload New Day Pass Section Image (optional)', 'sectionImage'),
          },
          { label: 'Day Pass Section' }
        ),
        activitiesHeadline: fields.text({
          label: 'Activities Section Headline',
          description: 'Heading shown above the activity cards.',
        }),
        activitiesIntro: fields.text({
          label: 'Activities Intro Text',
          multiline: true,
          description: 'Introductory paragraph for the activities section.',
        }),
        activityCards: fields.array(
          fields.object({
            title: fields.text({ label: 'Card Title' }),
            description: fields.text({ label: 'Card Description', multiline: true }),
            buttonText: fields.text({ label: 'Button Text' }),
            buttonLink: fields.text({ label: 'Button Link' }),
            imageLibraryPath: imageLibraryField(
              'Card Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.cardImage}`
            ),
            image: imageUploadField('Upload New Card Image (optional)', 'cardImage'),
            imageAlt: fields.text({ label: 'Image Alt Text' }),
          }),
          {
            label: 'Activity Cards',
            itemLabel: (props) => props.fields.buttonText.value || 'Activity Card',
          }
        ),
      },
    }),

    // =========================================
    // AMENITIES PAGE
    // =========================================
    amenitiesPage: singleton({
      label: 'Amenities Page',
      path: 'src/content/pages/amenities',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'AMENITIES' }),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        sectionHeadline: fields.text({
          label: 'Section Headline',
          defaultValue: 'MORE THAN JUST CLIMBING',
        }),
        introText: fields.text({
          label: 'Intro Paragraph',
          multiline: true,
          description: 'Introductory text shown below the section headline.',
        }),
        ctaText: fields.text({
          label: 'CTA Paragraph',
          multiline: true,
          description: 'Paragraph shown above the CTA buttons.',
        }),
        amenityCards: fields.array(
          fields.object({
            title: fields.text({ label: 'Amenity Title' }),
            description: fields.text({ label: 'Description', multiline: true }),
            imageLabel: fields.text({ label: 'Image Label' }),
            imageLibraryPath: imageLibraryField(
              'Amenity Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.cardImage}`
            ),
            image: imageUploadField('Upload New Amenity Image (optional)', 'cardImage'),
          }),
          {
            label: 'Amenity Cards',
            itemLabel: (props) => props.fields.title.value || 'Amenity',
          }
        ),
        ctaButtons: fields.array(
          fields.object({
            text: fields.text({ label: 'Button Text' }),
            url: fields.text({ label: 'Button URL' }),
          }),
          {
            label: 'CTA Buttons',
            itemLabel: (props) => props.fields.text.value || 'Button',
          }
        ),
      },
    }),

    // =========================================
    // SHOP PAGE
    // =========================================
    shopPage: singleton({
      label: 'Shop Page',
      path: 'src/content/pages/shop',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            headline: fields.text({ label: 'Headline', defaultValue: 'SHOP' }),
            backgroundImageLibraryPath: imageLibraryField(
              'Background Image (Media Library)',
              `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
            ),
            backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
            objectPositionX: objectPositionXField(),
            objectPositionY: objectPositionYField(),
          },
          { label: 'Hero Section' }
        ),
        gearStoreButton: fields.object(
          {
            text: fields.text({ label: 'Button Text', defaultValue: 'Gear store' }),
            url: fields.text({
              label: 'Button URL',
              defaultValue: 'https://portal.climbtheknot.com/gnv/shop',
            }),
          },
          { label: 'Gear Store Button' }
        ),
        intro: fields.text({
          label: 'Intro Text',
          multiline: true,
          description: 'Introductory paragraph for the shop',
        }),
      },
    }),
  },

  collections: {
    // =========================================
    // TEAM MEMBERS
    // =========================================
    team: collection({
      label: 'Team Members',
      slugField: 'name',
      path: 'src/content/team/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        role: fields.text({ label: 'Role/Title' }),
        teamGroup: fields.select({
          label: 'Team Section',
          description: 'Controls which About page team section this person appears in.',
          options: [
            { label: 'Leadership (Owners & Managers)', value: 'leadership' },
            { label: 'Coordinators', value: 'coordinator' },
            { label: 'Desk Staff & Instructors', value: 'staff' },
          ],
          defaultValue: 'staff',
        }),
        photoLibraryPath: imageLibraryField(
          'Photo (Media Library)',
          `Select an existing file from the shared media library. ${SIZE_GUIDANCE.teamPhoto}`
        ),
        bio: fields.text({ label: 'Bio', multiline: true }),
        photo: imageUploadField('Upload New Photo (optional)', 'teamPhoto', 'Optional upload. Use Media Library above for existing files. '),
        order: fields.integer({
          label: 'Display Order',
          defaultValue: 99,
          description: 'Lower numbers appear first',
        }),
        isLeadership: fields.checkbox({
          label: 'Leadership Team (legacy)',
          description: 'Legacy fallback flag. Use Team Section above for placement.',
          defaultValue: false,
        }),
      },
    }),

    // =========================================
    // EVENTS
    // =========================================
    events: collection({
      label: 'Events',
      slugField: 'title',
      path: 'src/content/events/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Event Title' } }),
        date: fields.date({ label: 'Event Date' }),
        endDate: fields.date({
          label: 'End Date',
          description:
            'Optional. For multi-day (non-recurring) events — the page shows the range as "start – end". Leave blank for single-day events.',
        }),
        time: fields.text({
          label: 'Time',
          description:
            'e.g., 6:00 PM - 9:00 PM. Only use this if the event is NOT a recurring event — leave blank otherwise.',
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        imageLibraryPath: imageLibraryField(
          'Event Image (Media Library)',
          `Select an existing file from the shared media library. ${SIZE_GUIDANCE.eventImage}`
        ),
        image: imageUploadField('Upload New Event Image (optional)', 'eventImage', 'Optional upload. Use Media Library above for existing files. '),
        registrationLink: fields.text({
          label: 'Registration Link',
          description: 'URL for event registration (optional)',
        }),
        eventPage: fields.conditional(
          fields.checkbox({
            label: 'Has a Dedicated Event Page',
            description:
              'When checked, this event gets its own full page (linked from the event’s info block on the Events page), and you can add a flyer image below. Leave unchecked to show only the info block when a card is clicked.',
            defaultValue: false,
          }),
          {
            false: fields.empty(),
            true: fields.object(
              {
                flyerLibraryPath: imageLibraryField(
                  'Flyer Image (Media Library)',
                  `Shown beside the event details on the dedicated page. Select an existing file from the shared media library. ${SIZE_GUIDANCE.eventImage}`
                ),
                flyer: imageUploadField('Upload New Flyer (optional)', 'eventImage', 'Optional upload. Use Media Library above for existing files. '),
              },
              {
                label: 'Dedicated Event Page',
                description: 'Settings shown only on this event’s own page.',
              }
            ),
          }
        ),
        isFeatured: fields.checkbox({
          label: 'Featured Event',
          description:
            'Checking this includes the event in the candidates for "Our Next Event" at the top of the Events page.',
          defaultValue: false,
        }),
        recurring: fields.conditional(
          fields.checkbox({ label: 'Recurring Event', defaultValue: false }),
          {
            false: fields.empty(),
            true: fields.object(
              {
                monday: recurringDayField('Monday'),
                tuesday: recurringDayField('Tuesday'),
                wednesday: recurringDayField('Wednesday'),
                thursday: recurringDayField('Thursday'),
                friday: recurringDayField('Friday'),
                saturday: recurringDayField('Saturday'),
                sunday: recurringDayField('Sunday'),
              },
              {
                label: 'Recurring Schedule',
                description:
                  'Check each day this event repeats on, then choose start and end times.',
              }
            ),
          }
        ),
        address: fields.text({
          label: 'Event Address',
          description: 'Venue address if different from gym (e.g., 704 S Main St)',
        }),
        competitionDivisions: fields.array(
          fields.object({
            name: fields.text({ label: 'Division Name' }),
            description: fields.text({ label: 'Description', multiline: true }),
            buttons: fields.array(
              fields.object({
                text: fields.text({ label: 'Button Text' }),
                url: fields.text({
                  label: 'Button Link',
                  description: 'URL the button opens. Leave blank to hide this button.',
                }),
              }),
              {
                label: 'Buttons',
                description:
                  'Buttons shown under this division (e.g. a registration link). A button with no link is hidden.',
                itemLabel: (props) => props.fields.text.value || 'Button',
              }
            ),
          }),
          {
            label: 'Divisions',
            itemLabel: (props) => props.fields.name.value || 'Division',
          }
        ),
        schedule: fields.array(
          fields.object({
            title: fields.text({ label: 'Section Title', description: 'e.g., "Climbing", "Finals"' }),
            content: fields.text({
              label: 'Content',
              multiline: true,
              description:
                'The block of text shown when this section is expanded. Line breaks are preserved. Wrap text in **double asterisks** to make it bold (e.g. **8:15 - 8:40AM**).',
            }),
            openByDefault: fields.checkbox({
              label: 'Open by Default',
              description: 'When checked, this section starts expanded on the page.',
              defaultValue: false,
            }),
          }),
          {
            label: 'Event Schedule',
            description: 'Each item is a collapsible section with a title and a block of text.',
            itemLabel: (props) => props.fields.title.value || 'Schedule Section',
          }
        ),
        faqItems: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
          }),
          {
            label: 'Event FAQ',
            itemLabel: (props) => props.fields.question.value || 'FAQ',
          }
        ),
        merchandise: fields.array(
          fields.object({
            name: fields.text({ label: 'Item Name' }),
            description: fields.text({ label: 'Description', multiline: true }),
            price: fields.text({ label: 'Price' }),
            preorderLink: fields.text({ label: 'Pre-order Link' }),
          }),
          {
            label: 'Merchandise / Pre-orders',
            itemLabel: (props) => props.fields.name.value || 'Item',
          }
        ),
      },
    }),

    // =========================================
    // MEDIA ASSETS (Shared Library Index)
    // =========================================
    mediaAssets: collection({
      label: 'Media Assets',
      slugField: 'name',
      path: 'src/content/media-assets/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Asset Name' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Home', value: 'home' },
            { label: 'About', value: 'about' },
            { label: 'New Climbers', value: 'new-climbers' },
            { label: 'Membership', value: 'membership' },
            { label: 'Amenities', value: 'amenities' },
            { label: 'Events', value: 'events' },
            { label: 'Shop', value: 'shop' },
            { label: 'Team', value: 'team' },
            { label: 'Global', value: 'global' },
            { label: 'Other', value: 'other' },
          ],
          defaultValue: 'other',
        }),
        filePath: fields.pathReference({
          label: 'Media File (Library)',
          description: 'Select an existing media file from the shared library.',
          pattern: CMS_MEDIA_LIBRARY_PATTERN,
        }),
        altText: fields.text({
          label: 'Alt Text',
          description: 'Used when this asset appears as an image on the site.',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        notes: fields.text({
          label: 'Notes',
          multiline: true,
          description: 'Optional internal notes for editors.',
        }),
      },
    }),

    // =========================================
    // POLICIES (Rates & Policies Accordion)
    // =========================================
    policies: collection({
      label: 'Rates & Policies',
      slugField: 'title',
      path: 'src/content/policies/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          links: true,
          dividers: true,
        }),
        buttonText: fields.text({ label: 'Button Text (optional)' }),
        buttonLink: fields.text({ label: 'Button Link (optional)' }),
        order: fields.integer({
          label: 'Display Order',
          defaultValue: 99,
          description: 'Lower numbers appear first',
        }),
      },
    }),

    // =========================================
    // PRODUCTS (Shop Items)
    // =========================================
    products: collection({
      label: 'Shop Products',
      slugField: 'name',
      path: 'src/content/products/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Product Name' } }),
        price: fields.text({
          label: 'Price',
          description: 'e.g., $29.99. Optional — leave blank if not known yet (displays as "none").',
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        imageLibraryPaths: fields.array(
          imageLibraryField('Product Image (Media Library)', `Select an existing image from the shared media library. ${SIZE_GUIDANCE.productImage}`),
          {
            label: 'Product Images (Media Library)',
            itemLabel: () => 'Library Image',
          }
        ),
        images: fields.array(
          imageUploadField('Upload New Image (optional)', 'productImage'),
          {
            label: 'Product Images (Upload Fallback)',
            itemLabel: () => 'Uploaded Image',
          }
        ),
        sizes: fields.array(fields.text({ label: 'Size' }), {
          label: 'Available Sizes',
          itemLabel: (props) => props.value || 'Size',
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Apparel', value: 'apparel' },
            { label: 'Essentials', value: 'essentials' },
            { label: 'Top-Rope Gear', value: 'top-rope-gear' },
            { label: 'Climbing Shoes', value: 'climbing-shoes' },
          ],
          defaultValue: 'apparel',
        }),
        inStock: fields.checkbox({
          label: 'In Stock',
          defaultValue: true,
        }),
        order: fields.integer({
          label: 'Display Order',
          defaultValue: 99,
        }),
      },
    }),

    // =========================================
    // CUSTOM PAGES (Modular pages built from blocks)
    // =========================================
    customPages: collection({
      label: 'Pages',
      slugField: 'slug',
      path: 'src/content/custom-pages/*',
      format: { data: 'json' },
      schema: {
        slug: fields.slug({
          name: { label: 'URL Slug', description: 'The URL path for this page (e.g. "community" → /community).' },
        }),
        title: fields.text({
          label: 'Page Title',
          description: 'Shown in the browser tab. Also used as the default nav label. Required.',
          validation: { length: { min: 1 } },
        }),
        seoDescription: fields.text({
          label: 'SEO Description',
          multiline: true,
          description: 'Used for search engine results and social shares. Aim for 150–160 characters.',
        }),
        isDraft: fields.checkbox({
          label: 'Draft',
          description: 'Drafts are NOT rendered on the live site. Uncheck when ready to publish.',
          defaultValue: true,
        }),
        showInNav: fields.checkbox({
          label: 'Show in main navigation',
          description: 'When checked, this page appears in the site header nav (after manual nav wiring).',
          defaultValue: false,
        }),
        navOrder: fields.integer({
          label: 'Nav Order',
          description: 'Lower numbers appear first in the nav.',
          defaultValue: 99,
        }),
        navLabel: fields.text({
          label: 'Nav Label (optional)',
          description: 'Override the title when showing in the nav. Leave blank to use the page title.',
        }),
        blocks: fields.blocks(
          {
            hero: {
              label: 'Hero',
              itemLabel: (props) => `Hero — ${props.fields.headline.value || 'Untitled'}`,
              schema: fields.object({
                headline: fields.text({
                  label: 'Headline',
                  description: 'Required.',
                  validation: { length: { min: 1 } },
                }),
                subtext: fields.text({
                  label: 'Subtext (optional)',
                  multiline: true,
                  description: 'Short paragraph below the headline.',
                }),
                backgroundImageLibraryPath: imageLibraryField(
                  'Background Image (Media Library)',
                  `Select an existing image from the shared media library. ${SIZE_GUIDANCE.heroImage}`
                ),
                backgroundImage: imageUploadField('Upload New Background Image (optional)', 'heroImage'),
                objectPositionX: objectPositionXField(),
                objectPositionY: objectPositionYField(),
              }),
            },
            richText: {
              label: 'Rich Text',
              itemLabel: () => 'Rich Text',
              schema: fields.object({
                content: fields.markdoc.inline({
                  label: 'Content',
                  options: {
                    bold: true,
                    italic: true,
                    strikethrough: true,
                    code: true,
                    link: true,
                    heading: [1, 2, 3, 4],
                    blockquote: true,
                    orderedList: true,
                    unorderedList: true,
                    divider: true,
                  },
                }),
                backgroundColor: fields.select({
                  label: 'Background Color',
                  options: [
                    { label: 'None / Transparent', value: 'transparent' },
                    ...BRAND_COLOR_OPTIONS,
                  ],
                  defaultValue: 'transparent',
                }),
                textColor: fields.select({
                  label: 'Text Color',
                  description: 'Choose a contrasting color for readability on the selected background.',
                  options: [
                    { label: 'Default (Black)', value: '#000000' },
                    { label: 'White', value: '#FFFFFF' },
                    ...BRAND_COLOR_OPTIONS.filter(
                      (c) => c.value !== '#000000' && c.value !== '#FFFFFF'
                    ),
                  ],
                  defaultValue: '#000000',
                }),
              }),
            },
            image: {
              label: 'Image',
              itemLabel: (props) => `Image — ${props.fields.alt.value || 'no alt'}`,
              schema: fields.object({
                imageLibraryPath: imageLibraryField(
                  'Image (Media Library)',
                  `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
                ),
                image: imageUploadField('Upload New Image (optional)', 'sectionImage'),
                alt: fields.text({
                  label: 'Alt Text',
                  description: 'Describes the image for screen readers and SEO. Required.',
                  validation: { length: { min: 1 } },
                }),
                caption: fields.text({
                  label: 'Caption (optional)',
                  description: 'Text shown below the image.',
                }),
                width: fields.select({
                  label: 'Width',
                  options: [
                    { label: 'Contained (max 1000px, centered)', value: 'contained' },
                    { label: 'Full-width (edge to edge)', value: 'full' },
                  ],
                  defaultValue: 'contained',
                }),
                backgroundColor: fields.select({
                  label: 'Background Color',
                  options: [
                    { label: 'None / Transparent', value: 'transparent' },
                    ...BRAND_COLOR_OPTIONS,
                  ],
                  defaultValue: 'transparent',
                }),
              }),
            },
            twoColumn: {
              label: 'Two Column (Image + Text)',
              itemLabel: () => 'Two Column',
              schema: fields.object({
                imageLibraryPath: imageLibraryField(
                  'Image (Media Library)',
                  `Select an existing image from the shared media library. ${SIZE_GUIDANCE.sectionImage}`
                ),
                image: imageUploadField('Upload New Image (optional)', 'sectionImage'),
                alt: fields.text({
                  label: 'Image Alt Text',
                  description: 'Required for accessibility.',
                  validation: { length: { min: 1 } },
                }),
                imageSide: fields.select({
                  label: 'Image Side',
                  options: [
                    { label: 'Image on Left', value: 'left' },
                    { label: 'Image on Right', value: 'right' },
                  ],
                  defaultValue: 'left',
                }),
                content: fields.markdoc.inline({
                  label: 'Text Column Content',
                  options: {
                    bold: true,
                    italic: true,
                    code: true,
                    link: true,
                    heading: [1, 2, 3, 4],
                    blockquote: true,
                    orderedList: true,
                    unorderedList: true,
                  },
                }),
                backgroundColor: fields.select({
                  label: 'Background Color',
                  options: [
                    { label: 'None / Transparent', value: 'transparent' },
                    ...BRAND_COLOR_OPTIONS,
                  ],
                  defaultValue: 'transparent',
                }),
                textColor: fields.select({
                  label: 'Text Color',
                  options: [
                    { label: 'Default (Black)', value: '#000000' },
                    { label: 'White', value: '#FFFFFF' },
                    ...BRAND_COLOR_OPTIONS.filter(
                      (c) => c.value !== '#000000' && c.value !== '#FFFFFF'
                    ),
                  ],
                  defaultValue: '#000000',
                }),
              }),
            },
            accordion: {
              label: 'Accordion (FAQ / Values list)',
              itemLabel: (props) =>
                `Accordion — ${props.fields.headline.value || 'Untitled'}`,
              schema: fields.object({
                headline: fields.text({
                  label: 'Section Headline',
                  description: 'Required.',
                  validation: { length: { min: 1 } },
                }),
                items: fields.array(
                  fields.object({
                    title: fields.text({
                      label: 'Title / Question',
                      validation: { length: { min: 1 } },
                    }),
                    content: fields.text({
                      label: 'Content / Answer',
                      multiline: true,
                      validation: { length: { min: 1 } },
                    }),
                    buttonText: fields.text({ label: 'Button Text (optional)' }),
                    buttonLink: fields.text({ label: 'Button Link (optional)' }),
                  }),
                  {
                    label: 'Items (at least one required)',
                    itemLabel: (props) => props.fields.title.value || 'Item',
                    validation: { length: { min: 1 } },
                  }
                ),
                backgroundColor: fields.select({
                  label: 'Background Color',
                  options: [
                    { label: 'None / Transparent', value: 'transparent' },
                    ...BRAND_COLOR_OPTIONS,
                  ],
                  defaultValue: '#000000',
                }),
              }),
            },
            ctaButtons: {
              label: 'CTA Buttons',
              itemLabel: () => 'CTA Buttons',
              schema: fields.object({
                headline: fields.text({ label: 'Headline (optional)' }),
                subtext: fields.text({
                  label: 'Subtext (optional)',
                  multiline: true,
                }),
                buttons: fields.array(
                  fields.object({
                    text: fields.text({
                      label: 'Button Text',
                      validation: { length: { min: 1 } },
                    }),
                    url: fields.text({
                      label: 'Button URL',
                      validation: { length: { min: 1 } },
                    }),
                    style: fields.select({
                      label: 'Style',
                      options: [
                        { label: 'Manatee (Blue)', value: 'blue' },
                        { label: 'Rust (Red)', value: 'red' },
                      ],
                      defaultValue: 'blue',
                    }),
                  }),
                  {
                    label: 'Buttons (at least one required)',
                    itemLabel: (props) => props.fields.text.value || 'Button',
                    validation: { length: { min: 1 } },
                  }
                ),
                backgroundColor: fields.select({
                  label: 'Background Color',
                  options: [
                    { label: 'None / Transparent', value: 'transparent' },
                    ...BRAND_COLOR_OPTIONS,
                  ],
                  defaultValue: 'transparent',
                }),
              }),
            },
          },
          { label: 'Page Blocks' }
        ),
      },
    }),

    // =========================================
    // NOT READY TO COMMIT CARDS
    // =========================================
    notReadyCards: collection({
      label: 'Not Ready to Commit Cards',
      slugField: 'label',
      path: 'src/content/not-ready-cards/*',
      format: { data: 'json' },
      schema: {
        label: fields.slug({ name: { label: 'Card Label' } }),
        description: fields.text({ label: 'Description', multiline: true, validation: { length: { min: 1 } } }),
        buttonText: fields.text({ label: 'Button Text', validation: { length: { min: 1 } } }),
        buttonLink: fields.text({ label: 'Button Link', validation: { length: { min: 1 } } }),
        imageLibraryPath: imageLibraryField(
          'Card Image (Media Library)',
          `Select an existing image from the shared media library. ${SIZE_GUIDANCE.cardImage}`
        ),
        image: imageUploadField('Upload New Card Image (optional)', 'cardImage'),
        order: fields.integer({
          label: 'Display Order',
          defaultValue: 99,
        }),
      },
    }),
  },
});
