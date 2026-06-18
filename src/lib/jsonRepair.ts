/**
 * Best-effort repair of almost-valid JSON returned by an LLM.
 *
 * Handles the failure modes we actually see when Claude emits a long JSON
 * document by hand (synastry crash, czerwiec 2026):
 *   1. Niezescapowany cudzysłów wewnątrz wartości tekstowej
 *      ("…Mars mówi "działaj teraz", a Saturn…")  ← przyczyna crasha synastrii
 *   2. Dosłowne znaki sterujące (nowa linia / tab) wewnątrz stringa
 *   3. Przecinek końcowy przed } albo ]
 *   4. Ucięty output (max_tokens) — domyka otwarty string + nawiasy
 *
 * Celowo konserwatywny: przepisuje tylko znaki, co do których ma pewność że są
 * błędne, a wynik i tak przechodzi przez JSON.parse po stronie wywołującego.
 * Dlatego repairJson NIGDY nie powinien być wywoływany na poprawnym JSON-ie —
 * używaj go jako fallbacku po nieudanym JSON.parse.
 */
export function repairJson(input: string): string {
  const out: string[] = [];
  const stack: string[] = []; // śledzi otwarte '{' i '['
  let inString = false;
  let i = 0;
  const n = input.length;

  const isWs = (c: string) => c === " " || c === "\n" || c === "\t" || c === "\r";

  // Usuń ostatni wyemitowany przecinek (pomijając whitespace) — trailing comma.
  const dropTrailingComma = () => {
    for (let k = out.length - 1; k >= 0; k--) {
      if (isWs(out[k])) continue;
      if (out[k] === ",") out.splice(k, 1);
      break;
    }
  };

  while (i < n) {
    const ch = input[i];

    if (inString) {
      if (ch === "\\") {
        // Sekwencja escape — kopiuj dosłownie razem z następnym znakiem.
        out.push(ch);
        if (i + 1 < n) out.push(input[i + 1]);
        i += 2;
        continue;
      }
      if (ch === '"') {
        // Czy to realny koniec stringa, czy wewnętrzny niezescapowany cudzysłów?
        let j = i + 1;
        while (j < n && isWs(input[j])) j++;
        const next = j < n ? input[j] : "";
        let closes = false;
        if (next === "" || next === "}" || next === "]" || next === ":") {
          closes = true;
        } else if (next === ",") {
          // Realny separator tylko jeśli po przecinku zaczyna się nowy klucz/element.
          let k = j + 1;
          while (k < n && isWs(input[k])) k++;
          const after = k < n ? input[k] : "";
          // Po realnym separatorze następuje nowy klucz/element ("{[) albo
          // (przy trailing comma) domknięcie struktury (}]) lub koniec wejścia.
          if (after === '"' || after === "{" || after === "[" ||
              after === "}" || after === "]" || after === "") closes = true;
        }
        if (closes) {
          inString = false;
          out.push('"');
          i++;
          continue;
        }
        // Wewnętrzny cudzysłów → zescapuj.
        out.push("\\", '"');
        i++;
        continue;
      }
      // JSON zabrania dosłownych znaków sterujących w stringach — zescapuj je.
      if (ch === "\n") { out.push("\\n"); i++; continue; }
      if (ch === "\r") { out.push("\\r"); i++; continue; }
      if (ch === "\t") { out.push("\\t"); i++; continue; }
      out.push(ch);
      i++;
      continue;
    }

    // Poza stringiem
    if (ch === '"') { inString = true; out.push(ch); i++; continue; }
    if (ch === "{" || ch === "[") { stack.push(ch); out.push(ch); i++; continue; }
    if (ch === "}" || ch === "]") {
      dropTrailingComma();
      if (stack.length) stack.pop();
      out.push(ch);
      i++;
      continue;
    }
    out.push(ch);
    i++;
  }

  // Recovery po ucięciu (max_tokens): domknij otwarty string i nawiasy.
  if (inString) out.push('"');
  dropTrailingComma();
  while (stack.length) {
    out.push(stack.pop() === "{" ? "}" : "]");
  }

  return out.join("");
}
