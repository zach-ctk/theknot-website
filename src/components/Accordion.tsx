import { useState } from 'react';

interface AccordionItem {
  title: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
    <div className="accordion">
      {items.map((item, index) => {
        const contentId = `accordion-content-${index}`;
        const headerId = `accordion-header-${index}`;

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
              {(item.content ?? '').split('\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="accordion-text">
                  {paragraph}
                </p>
              ))}
              {item.buttonText && item.buttonLink && (
                <div className="accordion-button-container">
                  <a
                    href={item.buttonLink}
                    className="accordion-button"
                    target={item.buttonLink.startsWith('http') ? '_blank' : undefined}
                    rel={item.buttonLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {item.buttonText}
                  </a>
                </div>
              )}
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
          padding: 24px;
          background-color: rgba(57, 57, 59, 0.5);
          text-align: center;
        }

        .accordion-text {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 14px;
          color: white;
          line-height: 1.6;
          margin: 0 0 16px;
        }

        .accordion-text:last-of-type {
          margin-bottom: 0;
        }

        .accordion-button-container {
          margin-top: 24px;
        }

        .accordion-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: min(100%, 500px);
          min-height: 55px;
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

        @media (max-width: 768px) {
          .accordion-header {
            padding: 16px 20px;
          }

          .accordion-title {
            font-size: 14px;
          }

          .accordion-content-inner {
            padding: 20px;
          }

          .accordion-text {
            font-size: 14px;
          }

          .accordion-button {
            width: 100%;
            max-width: 320px;
            padding: 16px 24px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
