import { useState } from 'react';

interface AccordionItemData {
  title: string;
  defaultOpen?: boolean;
}

export default function NewClimberSafetyAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const items: AccordionItemData[] = [
    { title: 'CLIMB AT YOUR OWN RISK!', defaultOpen: true },
    { title: 'INDOOR CLIMBING ETIQUETTE' },
    { title: 'ROUTE GRADES' },
    { title: 'KIDS POLICIES' },
    { title: 'CODE OF CONDUCT' },
  ];

  return (
    <div className="safety-accordion">
      {items.map((item, index) => (
        <div key={index} className="safety-accordion-item">
          <button
            className={`safety-accordion-header ${openIndex === index ? 'safety-accordion-header--open' : ''}`}
            onClick={() => toggleItem(index)}
            aria-expanded={openIndex === index}
          >
            <span className="safety-accordion-title">{item.title}</span>
            <span className="safety-accordion-icon">
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
            className="safety-accordion-content"
            style={{
              maxHeight: openIndex === index ? '2000px' : '0',
              opacity: openIndex === index ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.4s ease, opacity 0.3s ease',
            }}
          >
            <div className="safety-accordion-content-inner">
              {index === 0 && <ClimbAtYourOwnRisk />}
              {index === 1 && <IndoorClimbingEtiquette />}
              {index === 2 && <RouteGrades />}
              {index === 3 && <KidsPolicies />}
              {index === 4 && <CodeOfConduct />}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        /* Chrome matches the shared Accordion.tsx (membership/home page):
           8px-gapped bordered items, graphite headers, Rubik titles, teal icon,
           semi-transparent graphite content panel. Inner content styling below
           is intentionally left as-is. */
        .safety-accordion {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .safety-accordion-item {
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0;
          overflow: hidden;
        }

        .safety-accordion-header {
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

        .safety-accordion-header:hover {
          background-color: #4a4a4c;
        }

        .safety-accordion-header--open {
          background-color: #4a4a4c;
        }

        .safety-accordion-title {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0;
          text-align: left;
        }

        .safety-accordion-icon {
          color: var(--color-manatee, #84BABF);
          display: flex;
          align-items: center;
        }

        .safety-accordion-content-inner {
          padding: 24px 40px 32px 40px;
          background-color: rgba(57, 57, 59, 0.5);
        }

        .safety-accordion-content-inner h3 {
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-coral, #D89B92);
          margin: 24px 0 12px 0;
          text-transform: uppercase;
        }

        .safety-accordion-content-inner h3:first-child {
          margin-top: 0;
        }

        .safety-accordion-content-inner p {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 24px 0;
          color: #ccc;
        }

        .safety-accordion-content-inner ul {
          list-style: disc;
          padding-left: 24px;
          margin: 0 0 16px 0;
        }

        .safety-accordion-content-inner li {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 15px;
          line-height: 1.7;
          color: #ccc;
          margin-bottom: 6px;
        }

        .safety-accordion-content-inner li strong {
          color: #fff;
          font-weight: 700;
        }

        .safety-accordion-content-inner ul ul {
          list-style: circle;
          padding-left: 20px;
          margin-top: 6px;
        }

        .safety-accordion-content-inner .note {
          font-family: var(--font-body, 'Rubik', sans-serif);
          font-size: 14px;
          font-style: italic;
          color: #aaa;
          margin-top: 24px;
        }

        .safety-accordion-content-inner a {
          color: var(--color-coral, #D89B92);
          text-decoration: none;
        }

        .safety-accordion-content-inner a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .safety-accordion-header {
            padding: 16px 20px;
          }

          .safety-accordion-title {
            font-size: 14px;
          }

          .safety-accordion-content-inner {
            padding: 20px 20px 24px 20px;
          }

          .safety-accordion-content-inner h3 {
            font-size: 14px;
          }

          .safety-accordion-content-inner li {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

function ClimbAtYourOwnRisk() {
  return (
    <>
      <h3>CLIMBING IS INHERENTLY DANGEROUS</h3>
      <ul>
        <li>Use caution when down climbing and utilize the down climbing holds</li>
      </ul>

      <h3>BE AWARE OF YOUR SURROUNDINGS</h3>
      <ul>
        <li>Do not sit, stand, or walk underneath other climbers</li>
        <li>Keep your distance when climbing - Do not climb above, below, or close to another climber.</li>
        <li>Keep climbing areas clear of trip hazards (water bottles, phones, chalk bags, etc.).</li>
      </ul>

      <h3>USE CAUTION WHEN FALLING</h3>
      <ul>
        <li>Injuries can still occur when falling on padding.</li>
        <li>Do not stick out any limbs to stop yourself.</li>
        <li>Bend your knees to absorb the fall.</li>
      </ul>

      <h3>USE CORRECT CLIMBING EQUIPMENT</h3>
      <ul>
        <li>Climbing shoes <strong>MUST</strong> be worn while climbing.
          <ul>
            <li>No bare feet, sneakers, sandals, or toe shoes</li>
          </ul>
        </li>
        <li>Do not wear harnesses in the bouldering areas.</li>
      </ul>

      <h3>DO NOT SPOT A CLIMBER UNLESS ASKED TO DO SO</h3>
      <ul>
        <li>If you aren't comfortable with spotting, <strong>do not do it</strong>.</li>
      </ul>
    </>
  );
}

function IndoorClimbingEtiquette() {
  return (
    <>
      <h3>General Courtesy</h3>
      <ul>
        <li>Communicate with other climbers before starting a route</li>
        <li>Take turns on popular routes - <strong>do not</strong> hog the wall</li>
        <li>Be aware of your surroundings and other climbers</li>
        <li>Keep chalk use reasonable - brush holds when done</li>
      </ul>

      <h3>Bouldering Etiquette</h3>
      <ul>
        <li>Wait for the climber above you to finish before starting</li>
        <li>Call out "FALLING!" loudly when you come off the wall</li>
        <li>Spot climbers when appropriate - ask if they want a spot first</li>
        <li>Keep the landing zone clear of bags, shoes, and other items</li>
      </ul>

      <h3>Top-Rope Etiquette</h3>
      <ul>
        <li>Double-check your partner's knot and belay device</li>
        <li>Communicate clearly: "On belay?" "Belay on!" "Climbing!" "Climb on!"</li>
        <li>Stay attentive while belaying - <strong>do not</strong> use your phone</li>
        <li>Lower climbers smoothly and at a controlled pace</li>
      </ul>
    </>
  );
}

function RouteGrades() {
  return (
    <>
      <p>
        Route grades indicate difficulty level. Our gym uses the V-Scale for bouldering
        and the Yosemite Decimal System (YDS) for top-rope routes.
      </p>

      <h3>Bouldering (V-Scale)</h3>
      <ul>
        <li><strong>VB - V1:</strong> Beginner - large holds, straightforward movement</li>
        <li><strong>V2 - V3:</strong> Intermediate - smaller holds, requires technique</li>
        <li><strong>V4 - V5:</strong> Advanced - challenging moves, good strength required</li>
        <li><strong>V6+:</strong> Expert - highly technical, significant strength and skill</li>
      </ul>

      <h3>Top-Rope (YDS)</h3>
      <ul>
        <li><strong>5.6 - 5.8:</strong> Beginner - easy climbing, comfortable for new climbers</li>
        <li><strong>5.9 - 5.10:</strong> Intermediate - steeper terrain, technique matters</li>
        <li><strong>5.11 - 5.12:</strong> Advanced - demanding routes, experience required</li>
        <li><strong>5.13+:</strong> Expert - elite-level difficulty</li>
      </ul>

      <p className="note">
        Grades are subjective and can vary between setters. Use them as a general guide,
        not an absolute measure of your ability.
      </p>
    </>
  );
}

function KidsPolicies() {
  return (
    <>
      <h3>Age Requirements</h3>
      <ul>
        <li>Children under 14 <strong>MUST</strong> be supervised by a parent/guardian at all times</li>
        <li>Ages 14-17 may climb unsupervised with signed waiver on file</li>
        <li>Youth belay certification available for ages 12+ (requires test)</li>
      </ul>

      <h3>Bouldering Rules</h3>
      <ul>
        <li>Children under 8 must stay in designated kids zone</li>
        <li>Climbing height limit of 6 feet for unsupervised children under 14</li>
        <li>Adult spotter required for children in main bouldering area</li>
      </ul>

      <h3>Top-Rope Rules</h3>
      <ul>
        <li>Children under 40 lbs may have difficulty with auto-belays</li>
        <li>Adult belayer required for all youth climbing on rope</li>
        <li>Youth belay test required before belaying other climbers</li>
      </ul>
    </>
  );
}

function CodeOfConduct() {
  return (
    <>
      <p>
        The Knot is committed to providing a welcoming, inclusive, and safe environment
        for all climbers. We expect all members and guests to treat each other with respect.
      </p>

      <h3>Expected Behavior</h3>
      <ul>
        <li>Be kind, respectful, and supportive of all climbers</li>
        <li>Help create a welcoming environment for newcomers</li>
        <li>Offer encouragement and constructive feedback when appropriate</li>
        <li>Take responsibility for your actions and their impact on others</li>
      </ul>

      <h3>Prohibited Behavior</h3>
      <ul>
        <li>Harassment, discrimination, or bullying of any kind</li>
        <li>Unsolicited coaching or "beta spraying" without consent</li>
        <li>Reckless behavior that endangers yourself or others</li>
        <li>Damage to equipment, holds, or facility property</li>
      </ul>

      <p>
        Violations may result in membership suspension or termination.
        Report concerns to staff or email{' '}
        <a href="mailto:info@climbtheknot.com">info@climbtheknot.com</a>
      </p>
    </>
  );
}
