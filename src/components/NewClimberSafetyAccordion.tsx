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

        /* Content type follows the shared --body-size token. */
        .safety-accordion-content-inner h3 {
          font-family: var(--font-heading, 'Uniform Pro', sans-serif);
          font-size: var(--body-size, 16px);
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
          font-size: var(--body-size, 16px);
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
          font-size: var(--body-size, 16px);
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
      <h3>CONSENT</h3>
      <ul>
        <li>Always get consent! Ask before:
          <ul>
            <li>Giving beta or advice to another climber</li>
            <li>Spotting another climber</li>
          </ul>
        </li>
      </ul>

      <h3>ON THE WALL</h3>
      <ul>
        <li>Take turns climbing with others.</li>
        <li>If someone just brushed a route, let them climb it first.</li>
        <li>Do your best not to bleed on anything - holds, walls, padding, rentals, friends, family - but let a staff member know if you do.</li>
      </ul>

      <h3>OFF THE WALL</h3>
      <ul>
        <li>Don't stand, sit, walk, or leave belongings in fall zones.</li>
        <li>Try to keep your chalk contained to your chalk bag. If you spill, let a staff member know so we can clean it up.</li>
      </ul>

      <h3>GEAR</h3>
      <ul>
        <li>Wear appropriate climbing gear and attire:
          <ul>
            <li>Wear climbing shoes while on the wall</li>
            <li>Take off your harness while bouldering</li>
            <li>Keep your top on in the gym</li>
            <li>When top-roping, tie back hair, avoid loose fitting clothes or jewelry, and tuck your shirt into your harness</li>
          </ul>
        </li>
      </ul>
    </>
  );
}

function RouteGrades() {
  return (
    <ul>
      <li>
        At The Knot, we use the V-scale to rate boulder problems (V0 - V10+) and the
        Yosemite Decimal System (YDS) for top-rope routes (5.5 - 5.13). In both systems,
        the higher the number, the more difficult the problem will feel.
      </li>
      <li>
        While grades offer a general sense of challenge, they're subjective and may feel
        different for each climber. You can find route grades on the back of Start Tags or
        in our climbing app
      </li>
    </ul>
  );
}

function KidsPolicies() {
  return (
    <ul>
      <li>Each person under 16 needs an adult (18 or older) chaperone.</li>
      <li>Chaperone-to-child ratio for children under 13 must be 1:1; each child needs their own chaperone.
        <ul>
          <li>Chaperones for children under 13 must be in constant visual contact with their child.</li>
          <li>Chaperones for children 13-15 need not stay in constant visual contact, but must come in and remain in the gym while they are here.</li>
        </ul>
      </li>
      <li>Chaperones-to-child ratio for children 13-15 must be a max of 1:4.</li>
      <li>No one under 13 is allowed to:
        <ul>
          <li>Belay</li>
          <li>Be in the gym past 6:00PM</li>
          <li>Use the weightlifting/workout area</li>
        </ul>
      </li>
      <li>No one under 5 may climb anywhere in the facility.</li>
      <li>Minors (under 18) cannot fill out their own waivers; a parent or guardian must fill it out for them.
        <ul>
          <li>All waivers for minors must additionally have a photo of the parent or guardian's ID attached. These can be texted to The Knot at 352-322-2402 with the message: "For [insert minor's name]."</li>
        </ul>
      </li>
    </ul>
  );
}

function CodeOfConduct() {
  return (
    <ul>
      <li>
        At The Knot Climbing Gym, we are committed to providing a welcoming, inclusive,
        and safe environment for all of our climbers and staff. We believe that everyone
        deserves to feel respected and valued while enjoying their time in our facility.
      </li>
      <li>
        As such, we have a zero-tolerance policy for any form of harassment,
        discrimination, violence, suggestion of violence, hate speech, or any other
        unwanted behavior that makes others feel uncomfortable. This policy may (at
        management's sole discretion) be applied to behavior both inside and outside The
        Knot Climbing Gym.
      </li>
    </ul>
  );
}
