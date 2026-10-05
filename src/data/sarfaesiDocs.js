/**
 * The document checklists a case has to clear at each SARFAESI stage.
 *
 * Each stage is a list of groups, and each group a list of documents. The
 * groups are not decoration: Section 14 and Physical both mix papers that come
 * from the lender with ones that come from the court or the police, and a flat
 * list of thirty tickboxes hides which party is holding a case up.
 *
 * Ids are stable slugs because a case stores the ids it has uploaded. Renaming
 * a label is safe; renaming an id would silently un-tick every case.
 */

export const SARFAESI_STAGE = {
  SYMBOLIC: "SYMBOLIC",
  SECTION_14: "SECTION_14",
  PHYSICAL: "PHYSICAL",
};

export const STAGE_LABELS = {
  SYMBOLIC: "Symbolic Possession",
  SECTION_14: "Section 14",
  PHYSICAL: "Physical Possession",
};

export const STAGE_ORDER = [
  SARFAESI_STAGE.SYMBOLIC,
  SARFAESI_STAGE.SECTION_14,
  SARFAESI_STAGE.PHYSICAL,
];

const SYMBOLIC_DOCS = [
  {
    title: "Notice and publication",
    docs: [
      { id: "sym-demand-notice", label: "Demand Notice" },
      {
        id: "sym-demand-ack",
        label: "Demand Notice Acknowledgement / Proof of Service",
      },
      { id: "sym-appendix-iv", label: "Appendix IV Possession Notice" },
      { id: "sym-paper-english", label: "English Newspaper Publication Copy" },
      {
        id: "sym-paper-vernacular",
        label: "Vernacular Newspaper Publication Copy",
      },
      {
        id: "sym-affixing-proof",
        label: "Proof of Affixing Notice at Property",
      },
      {
        id: "sym-geo-photo",
        label: "Geo-tagged Photograph of Affixed Notice",
      },
    ],
  },
];

const SECTION_14_DOCS = [
  {
    /* One run of nine steps rather than two lists: section 14 is a sequence -
       compile, file, wait on the magistrate, collect - and splitting it in two
       hid that the waiting sits in the middle of it. */
    title: "Petition and order",
    docs: [
      { id: "s14-statutory", label: "Compile statutory documents", owner: "AO" },
      {
        /* A bundle, not a paper. The ten below are what the bank asks for and
           are numbered the way the checklist itself numbers them, because it is
           referred to by item number; several are themselves a set, which is
           why items 4, 8, 9 and 10 carry a note saying what has to be in them.
           The step is done when all ten are in. */
        label: "Compile Section 14 document checklist",
        owner: "AO",
        items: [
          { id: "s14-demand-notice", label: "Demand Notice Copy" },
          { id: "s14-demand-ack", label: "Demand Notice Acknowledgement" },
          { id: "s14-possession-notice", label: "Possession Notice" },
          {
            id: "s14-paper-copies",
            label: "Two paper publication copies of the Possession Notice",
            note: "with paper name & date written on them",
          },
          { id: "s14-loan-applications", label: "Loan Applications" },
          { id: "s14-sanction-memos", label: "Loan Sanction Memorandums" },
          { id: "s14-loan-agreements", label: "Loan Agreements" },
          {
            id: "s14-title-deposit",
            label:
              "Letter evidencing deposit of Title Deeds, or Memorandum of Deposit of Title Deeds",
            note: "EMT / SMT related papers",
          },
          {
            id: "s14-property-papers",
            label: "Property related papers",
            note: "Sale Deed / Haku Patra / Gift Deed (last executed deed), EC, Khatha",
          },
          {
            id: "s14-photos-soa",
            label: "Photos of the property & Statement of Accounts as on date",
            note: "for all loan accounts",
          },
        ],
      },
      { id: "s14-cersai", label: "Verify CERSAI registration", owner: "AGENT" },
      {
        id: "s14-possession-photos",
        label:
          "Photos of affixed Possession Notice at property (geo-tagged photo)",
        owner: "AGENT",
      },
      { id: "s14-petition", label: "Upload filed petition", owner: "AGENT" },
      {
        id: "s14-court-filing",
        label: "File with Chief Judicial Magistrate",
        owner: "AO",
      },
      {
        /* The one step nobody here can push. It is the stage's long pole, so
           it is marked as such rather than sitting as one more row. */
        id: "s14-magistrate-order",
        label: "Track magisterial disposal",
        owner: "COURT",
        critical: true,
        sla: "60-day SLA",
      },
      { id: "s14-order-copy", label: "Upload Order Copy", owner: "AGENT" },
      {
        id: "s14-originals-collected",
        label: "Collect originals from court and submit to bank",
        owner: "AGENT",
      },
    ],
  },
];

/**
 * Who has to do the step. A checklist that only says what is outstanding does
 * not say who to chase, and at this stage the answer is often not the agent:
 * the occupants have to be given their notice period, the police have to
 * acknowledge the requisition, the court commissioner has to hand over the
 * keys.
 */
export const DOC_OWNER = {
  AGENT: "Agent",
  OCCUPANTS: "Occupants",
  POLICE: "Police",
  COURT: "Court",
  AO: "AO",
};

const PHYSICAL_DOCS = [
  {
    title: "Vacate notice",
    docs: [
      {
        id: "phy-order-copy",
        label: "Upload Order Copy",
        owner: "AGENT",
        critical: true,
      },
      {
        id: "phy-property-location",
        label: "Identify Schedule Property Location",
        owner: "AGENT",
      },
      {
        id: "phy-warrant",
        label: "Upload Court Commissioner Warrant",
        owner: "AGENT",
      },
      {
        id: "phy-vacate-draft",
        label: "Draft vacate notice for occupants",
        owner: "AGENT",
      },
      {
        id: "phy-vacate-affix",
        label: "Affix vacate notice at property (geo-tagged)",
        owner: "AGENT",
      },
      {
        id: "phy-vacate-service",
        label: "Serve vacate notice on identified occupants",
        owner: "AGENT",
      },
      {
        id: "phy-vacate-period",
        label: "Observe vacate notice period",
        owner: "OCCUPANTS",
        sla: "7-day SLA",
      },
    ],
  },
  {
    title: "Police coordination",
    docs: [
      {
        id: "phy-police-station",
        label: "Identify jurisdictional police station (SHO)",
        owner: "AGENT",
      },
      {
        id: "phy-police-requisition",
        label: "File requisition with concerned SHO or DCP / SP office",
        owner: "AGENT",
      },
      {
        id: "phy-police-ack",
        label: "Obtain written acknowledgement",
        owner: "POLICE",
        sla: "5-day SLA",
      },
      {
        id: "phy-police-team",
        label: "Confirm deployment and team strength",
        owner: "AGENT",
      },
    ],
  },
  {
    title: "Execution",
    docs: [
      {
        id: "phy-joint-visit",
        label: "Schedule joint visit (08:00-19:00 IST)",
        owner: "AGENT",
      },
      {
        id: "phy-witness-brief",
        label: "Brief field team and two independent witnesses",
        owner: "AGENT",
      },
      {
        id: "phy-panchnama",
        label: "Execute panchnama (Appendix I)",
        owner: "AGENT",
      },
      {
        id: "phy-inventory",
        label: "Capture inventory (Appendix II)",
        owner: "AGENT",
      },
      {
        id: "phy-key-handover",
        label: "Handover Keys to Bank/FI AO through Court Commissioner",
        owner: "COURT",
      },
      {
        id: "phy-submitted-branch",
        label:
          "Submit notarised panchnama, video and photographs to respective branch",
        owner: "AGENT",
      },
    ],
  },
  {
    title: "Post-possession",
    docs: [
      {
        id: "phy-guard",
        label: "Secure property by deploying security guards",
        owner: "AGENT",
        sla: "3-day SLA",
      },
      {
        id: "phy-valuation",
        label: "Commission valuation under Rule 8(5)",
        owner: "AO",
        sla: "30-day SLA",
      },
    ],
  },
];

export const STAGE_DOCS = {
  SYMBOLIC: SYMBOLIC_DOCS,
  SECTION_14: SECTION_14_DOCS,
  PHYSICAL: PHYSICAL_DOCS,
};

/**
 * Flat list of document ids for a stage, in checklist order.
 *
 * A step either is a document - it has an id - or is a bundle of them, in
 * which case it has `items` and no id of its own and counts as whatever its
 * items count. That is what keeps the Section 14 checklist ten tickable papers
 * while still reading as one step of the nine.
 */
export function docIdsFor(stage) {
  return (STAGE_DOCS[stage] ?? []).flatMap((group) =>
    group.docs.flatMap((doc) =>
      doc.items ? doc.items.map((item) => item.id) : [doc.id]
    )
  );
}

/** How many documents a stage asks for. */
export function docCountFor(stage) {
  return docIdsFor(stage).length;
}
