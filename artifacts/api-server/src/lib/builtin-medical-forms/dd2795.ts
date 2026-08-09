import { branch, form, q, select, text, date } from "./definition-helpers";

const section = "Health Assessment";

const pregnancy = branch(
  "4",
  "4 — Are you pregnant? (Females only)",
  section,
  [
    "Are you currently pregnant, or is pregnancy only a possibility at this time?",
    "Are there any current restrictions, limitations, or provider recommendations related to this?",
  ],
  {
    answerType: "dropdown",
    options: ["Don't know", "Yes", "No"],
    triggerValue: "yes|don't know",
  },
);

export const dd2795Definition = form(
  "dd-2795-pre-deployment-health-assessment",
  "DD Form 2795 — Pre-Deployment Health Assessment",
  "Adaptive applicant interview for the DD Form 2795 health-assessment items, preserving the source response logic and the recovered Occu-Med follow-up bank.",
  "DD Form 2795, May 1999",
  [
    text("demographics.lastName", "Last name", "Demographics", false),
    text("demographics.firstName", "First name", "Demographics", false),
    text("demographics.mi", "Middle initial", "Demographics", false),
    date("demographics.today", "Today's date", "Demographics", false),
    text("demographics.ssn", "Social Security Number", "Demographics", false),
    date("demographics.dob", "Date of birth", "Demographics", false),
    text("demographics.deployingUnit", "Deploying unit", "Demographics", false),
    q(
      "demographics.gender",
      "Gender",
      "Demographics",
      { answerType: "dropdown", options: ["Male", "Female"], required: false, triggerValue: "female" },
      [pregnancy],
    ),
    select("demographics.branch", "Service branch", "Demographics", ["Air Force", "Army", "Coast Guard", "Marine Corps", "Navy", "Other"], false),
    select("demographics.component", "Component", "Demographics", ["Active Duty", "National Guard", "Reserves", "Civilian Government Employee"], false),
    text("demographics.payGrade", "Pay grade", "Demographics", false),
    select("deployment.region", "Location of operation", "Deployment", ["Europe", "SW Asia", "SE Asia", "Asia (Other)", "South America", "Australia", "Africa", "Central America", "Unknown"], false),
    text("deployment.location", "Deployment location (city, town, or base)", "Deployment", false),
    text("deployment.country", "Country", "Deployment", false),
    text("deployment.operation", "Name of operation", "Deployment", false),

    branch(
      "1",
      "1 — Would you say your health in general is Excellent, Very Good, Good, Fair, or Poor?",
      section,
      [
        "What health issue or issues led you to rate your health this way?",
        "Are those issues current?",
        "Are you receiving treatment or taking medication for them?",
        "Do they affect your ability to perform your duties?",
      ],
      {
        answerType: "dropdown",
        options: ["Excellent", "Very Good", "Good", "Fair", "Poor"],
        triggerValue: "fair|poor",
      },
    ),
    branch(
      "2",
      "2 — Do you have any medical or dental problems?",
      section,
      [
        "What medical or dental problem are you referring to?",
        "Is it current or historical?",
        "Are you receiving treatment?",
        "Does it currently affect your duties or daily activities?",
      ],
    ),
    branch(
      "3",
      "3 — Are you currently on a profile, or light duty, or are you undergoing a medical board?",
      section,
      [
        "Are you currently on profile, light duty, or undergoing a medical board?",
        "What condition or issue is this related to?",
        "What restrictions are currently in place?",
        "When did this begin?",
        "Is it expected to resolve?",
      ],
    ),
    branch(
      "5",
      "5 — Do you have a 90-day supply of your prescription medication or birth control pills?",
      section,
      [
        "What medication do you take that does not have a 90-day supply available?",
        "How much supply do you currently have?",
        "Would access to this medication be a concern during the assignment?",
      ],
      { answerType: "dropdown", options: ["N/A", "Yes", "No"], triggerValue: "no" },
    ),
    branch(
      "6",
      "6 — Do you have two pairs of prescription glasses (if worn) and any other personal medical equipment?",
      section,
      [
        "Do you use glasses, contacts, or other personal medical equipment?",
        "What item is missing or unavailable?",
        "Would the lack of this item affect your ability to function safely or perform your duties?",
      ],
      { answerType: "dropdown", options: ["N/A", "Yes", "No"], triggerValue: "no" },
    ),
    branch(
      "7",
      "7 — During the past year, have you sought counseling or care for your mental health?",
      section,
      [
        "What condition or concern led you to seek counseling or care?",
        "Are you still in treatment or counseling?",
        "Are you taking any medication for this condition?",
        "Do you currently have symptoms, restrictions, or limitations?",
        "Would this require ongoing care during the assignment?",
      ],
    ),
    branch(
      "8",
      "8 — Do you currently have any questions or concerns about your health?",
      section,
      [
        "What health question or concern do you have?",
        "Is it related to a current medical condition?",
        "Do you need treatment, accommodation, or clarification before assignment?",
      ],
    ),
  ],
);
