import BankVisitCases from "../components/BankVisitCases";

/** The visit tracker on its own page, with the room to show every column. */
export default function BankVisitsPage({ cases = [] }) {
  return <BankVisitCases cases={cases} />;
}
