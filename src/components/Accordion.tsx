import { Fragment, useState } from 'react';

interface AccordionItem {
  title: string;
  /** Rust-colored sub-heading shown above the content, matching the red section
      titles inside the new-climbers safety accordion. */
  subheading?: string;
  content?: string;
  /** Legacy single button: wide, manatee-colored. Requires both text and link. */
  buttonText?: string;
  buttonLink?: string;
  /** Multiple compact rust-colored buttons, rendered side by side. Takes
      precedence over buttonText/buttonLink when present. A button with no
      link yet still renders (href falls back to #). */
  buttons?: {
    text?: string;
    link?: string;
  }[];
  /** Expand this item on first render. If several are flagged, the first wins —
      only one item is open at a time. */
  defaultOpen?: boolean;
}

const isExternal = (link?: string) => !!link && link.startsWith('http');

interface AccordionProps {
  items: AccordionItem[];
  /** Panel content alignment. Defaults to centered, which is how the FAQ,
      policies, and events accordions read. 'left' is for prose-heavy panels
      like the core values. Headers are always left-aligned either way. */
  align?: 'center' | 'left';
}

export default function Accordion({ items, align = 'center' }: AccordionProps) {
  const initialOpenIndex = items.findIndex((item) => item.defaultOpen);
  const [openIndex, setOpenIndex] = useState<number | null>(
    initialOpenIndex === -1 ? null : initialOpenIndex
  );

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(index);
    }
  };

  return (
    <div className={`accordion${align === 'left' ? ' accordion--left' : ''}`}>
      {items.map((item, index) => {
        const contentId = `accordion-content-${index}`;
        const headerId = `accordion-header-${index}`;

        const compactButtons = (item.buttons ?? []).filter((button) => button?.text);

        return (
        <div key={index} className="accordion-item">
          <button
            id={headerId}
            className={`accordion-header ${openIndex === index ? 'accordion-header--open' : ''}`}
            onClick={() => toggleItem(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-expanded={openIndex === index}
            aria-controls={contentId}
            role="button"
            tabIndex={0}
          >
            <span className="accordion-title">{item.title}</span>
            <span className="accordion-icon" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          <div
            id={contentId}
            className="accordion-content"
            role="region"
            aria-labelledby={headerId}
            style={{
              maxHeight: openIndex === index ? '1000px' : '0',
              opacity: openIndex === index ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease',
            }}
          >
            <div className="accordion-content-inner">
              {item.subheading && (
                <p className="accordion-subheading">{item.subheading}</p>
              )}
              {/* Blank lines (\n\n) separate paragraphs; single newlines are tight
                  line breaks within a paragraph. A paragraph whose first line is
                  "## Label" renders that line as a red heading with the rest of
                  the paragraph as its body — the labelled-block style used by the
                  new-climbers safety accordion. A line beginning with a bullet
                  marker (• ◦ ○ -) renders as a hanging-indent row so wrapped text
                  lines up under the text, not under the marker. A hollow marker
                  (◦ / ○) renders as an indented, nested bullet. */}
              {(item.content ?? '').split(/\n\s*\n/).map((paragraph, pIndex) => {
                const lines = paragraph.split('\n');

                const heading = /^##\s+(.*)$/.exec(lines[0] ?? '');
                if (heading) {
                  const body = lines.slice(1);
                  return (
                    <Fragment key={pIndex}>
                      <p className="accordion-heading">{heading[1]}</p>
                      {body.length > 0 && (
                        <p className="accordion-text">
                          {body.map((line, lIndex) => (
                            <span key={lIndex}>
                              {line}
                              {lIndex < body.length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      )}
                    </Fragment>
                  );
                }

                const isList = lines.some((line) => /^\s*[•●◦○\-]\s/.test(line));
                return (
                  <p
                    key={pIndex}
                    className={`accordion-text${isList ? ' accordion-text--list' : ''}`}
                  >
                    {lines.map((line, lIndex) => {
                      if (!isList) {
                        return (
                          <span key={lIndex}>
                            {line}
                            {lIndex < lines.length - 1 && <br />}
                          </span>
                        );
                      }
                      const bullet = /^\s*([•●◦○\-])\s+(.*)$/.exec(line);
                      if (!bullet) {
                        return (
                          <span key={lIndex} className="bullet-row bullet-row--plain">
                            {line}
                          </span>
                        );
                      }
                      const [, marker, text] = bullet;
                      const nested = marker === '◦' || marker === '○';
                      return (
                        <span
                          key={lIndex}
                          className={`bullet-row${nested ? ' bullet-row--nested' : ''}`}
                        >
                          <span className="bullet-marker" aria-hidden="true">
                            {marker}
                          </span>
                          <span>{text}</span>
                        </span>
                      );
                    })}
                  </p>
                );
              })}
              {compactButtons.length > 0 ? (
                <div className="accordion-button-container accordion-button-row">
                  {compactButtons.map((button, bIndex) => (
                    <a
                      key={bIndex}
                      href={button.link || '#'}
                      className="accordion-button accordion-button--compact"
                      target={isExternal(button.link) ? '_blank' : undefined}
                      rel={isExternal(button.link) ? 'noopener noreferrer' : undefined}
                    >
                      {button.text}
                    </a>
                  ))}
                </div>
              ) : item.buttonText && item.buttonLink ? (
                <div className="accordion-button-container">
                  <a
                    href={item.buttonLink}
                    className="accordion-button"
                    target={isExternal(item.buttonLink) ? '_blank' : undefined}
                    rel={isExternal(item.buttonLink) ? 'noopener noreferrer' : undefined}
                  >
                    {item.buttonText}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        );
      })}

      <style>{`
        .accordion {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .accordion-item {
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0;
          overflow: hidden;
        }

        .accordion-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background-color: var(--color-graphite, #39393B);
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .accordion-header:hover {
          background-color: #4a4a4c;
        }

        .accordion-header--open {
          background-color: #4a4a4c;
        }

        .accordion-title {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0;
          text-align: left;
        }

        .accordion-icon {
          color: var(--color-manatee, #84BABF);
          display: flex;
          align-items: center;
        }

        .accordion-content-inner {
          padding: 24px 40px;
          background-color: rgba(57, 57, 59, 0.5);
          text-align: center;
        }

        /* Matches the red section titles in NewClimberSafetyAccordion, minus the
           uppercase transform — the case comes from the copy itself.
           .accordion-subheading is the single one at the top of a panel;
           .accordion-heading is an inline "## Label" block within the content. */
        .accordion-subheading,
        .accordion-heading {
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: var(--body-size, 16px);
          font-weight: 700;
          color: var(--color-coral, #C97065);
          line-height: 1.5;
        }

        .accordion-subheading {
          margin: 0 0 12px;
        }

        .accordion-heading {
          margin: 20px 0 4px;
        }

        .accordion-heading:first-child {
          margin-top: 0;
        }

        .accordion-text {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: var(--body-size, 16px);
          color: white;
          line-height: 1.6;
          margin: 0 0 16px;
        }

        .accordion-text:last-of-type {
          margin-bottom: 0;
        }

        .accordion-text--list {
          /* Bullet lists are left-aligned. Indent them inward so the markers
             always sit past where a wrapped line of centered text would start,
             instead of poking out to the left of it. */
          text-align: left;
          padding-left: 32px;
          padding-right: 32px;
        }

        /* align="left": panel content runs flush left. The list indent above
           exists to clear centered text, so it's dropped here — bullets line up
           with the paragraphs instead. */
        .accordion--left .accordion-content-inner {
          text-align: left;
        }

        .accordion--left .accordion-text--list {
          padding-left: 0;
          padding-right: 0;
        }

        .bullet-row {
          display: flex;
          gap: 8px;
          align-items: baseline;
        }

        .bullet-row--nested {
          /* Indent nested items under their parent bullet. */
          padding-left: 24px;
        }

        .bullet-marker {
          flex: 0 0 auto;
        }

        .bullet-row--plain {
          display: block;
        }

        .accordion-button-container {
          margin-top: 24px;
        }

        /* Blue button: length/height from the shared tokens in global.css. */
        .accordion-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: min(100%, var(--btn-blue-width, 500px));
          min-height: var(--btn-blue-height, 55px);
          box-sizing: border-box;
          padding: 14px 32px;
          background-color: var(--color-manatee, #84BABF);
          color: black;
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          letter-spacing: 0;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .accordion-button:hover {
          opacity: 0.9;
        }

        /* Row of compact buttons, sized to match the new-climbers activity
           card buttons (rust, 200px cap, 16px/20px padding). */
        .accordion-button-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          /* Row gap stays tight for when the buttons stack on narrow screens;
             the wider column gap is the side-by-side spacing. */
          gap: 16px 48px;
        }

        .accordion-button--compact {
          min-width: 0;
          min-height: 0;
          width: 100%;
          max-width: 200px;
          box-sizing: border-box;
          padding: 16px 20px;
          background-color: var(--color-rust, #b94237);
          color: #fff;
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .accordion-header {
            padding: 16px 20px;
          }

          .accordion-title {
            font-size: 14px;
          }

          .accordion-content-inner {
            padding: 20px 28px;
          }

          .accordion-text--list {
            padding-left: 18px;
            padding-right: 18px;
          }

          .accordion-button {
            width: 100%;
            max-width: 320px;
            padding: 16px 24px;
            font-size: 14px;
          }

          /* Keep the compact buttons compact — the rule above would otherwise
             widen them to 320px on mobile. */
          .accordion-button--compact {
            max-width: 200px;
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
}
