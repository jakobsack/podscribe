interface TimestampParams {
  seconds: number;
  includeHundredth?: boolean;
}

export const Timestamp = ({ seconds, includeHundredth }: TimestampParams) => {
  const calcHours = Math.floor(seconds / 3600);
  const calcMinutes = Math.floor((seconds - calcHours * 3600) / 60);
  const calcSeconds = seconds % 60;

  const displaySeconds = `${calcSeconds < 10 ? "0" : ""}${includeHundredth ? calcSeconds.toFixed(2) : Math.floor(calcSeconds)}`;
  const displayMinutes = `${calcMinutes < 10 ? "0" : ""}${calcMinutes}:`;
  const displayHours = calcHours ? `${calcHours}:` : "";

  return (
    <>
      {displayHours}
      {displayMinutes}
      {displaySeconds}
    </>
  );
};
