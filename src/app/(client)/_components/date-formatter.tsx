import { parseISO, format } from "date-fns";

type Props = {
  dateString: string;
  monthOnly?: boolean;
};

const DateFormatter = ({ dateString, monthOnly }: Props) => {
  const date = parseISO(dateString);
  return <time dateTime={dateString}>{monthOnly ? format(date, "LLLL yyyy") : format(date, "LLLL\td, yyyy")}</time>;
};

export default DateFormatter;
