/**
 * 公開 Google スプレッドシートの CSV エクスポートをパースする。
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      if (char === "\r") i += 1;
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export async function fetchSpreadsheetCsvRows(
  spreadsheetId: string,
): Promise<{ success: true; rows: string[][] } | { success: false; error: string }> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 } });

    if (!response.ok) {
      return {
        success: false,
        error: `スプレッドシートからデータを取得できませんでした。（${response.status}）`,
      };
    }

    const text = await response.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return { success: true, rows: [] };
    }

    return { success: true, rows };
  } catch {
    return {
      success: false,
      error:
        "システム一覧の取得中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}
