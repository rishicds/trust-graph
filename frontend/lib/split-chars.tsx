const PUNCTUATION = /[,.!?;:'"()[\]{}\-–—]/;

export function splitChars(text: string, className?: string) {
  return text.split("").map((char, index) => {
    if (char === " ") {
      return (
        <span
          key={`space-${index}`}
          className="char inline-block w-[0.35em]"
          aria-hidden
        >
          {" "}
        </span>
      );
    }

    const display = PUNCTUATION.test(char) ? "inline" : "inline-block";

    return (
      <span key={`${char}-${index}`} className={`char ${display} ${className ?? ""}`}>
        {char}
      </span>
    );
  });
}
