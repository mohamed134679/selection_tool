/**
 * pdfTableHelpers.js
 *
 * Builds the pdfmake `table` node from a { headers, rows } table model.
 * Kept in its own file, with NO import of the `pdfmake` package, so the
 * width-count logic can be unit tested without installing/loading pdfmake
 * (pdfmake only matters at render time, not at doc-definition-assembly
 * time).
 *
 * This is also where the "_minWidth" crash lived: pdfmake's table
 * measurer throws if `widths.length` doesn't match the actual number of
 * columns in the table body. That happened here because
 * buildHardwareSection (projectNarrative.js) emits 6 columns (Hardware,
 * Qty, I/O Points, Ref. Number, IO Ref. Number, Connected I/O) but the
 * widths array used to be hardcoded to 5 entries. Building widths from the
 * real header count means this can't drift out of sync again.
 */

const COLORS = {
  green: "#3DCD58",
  bg: "#F4F7F5",
  hairline: "#D8DEDA",
};

/**
 * @param {{ headers: string[], rows: string[][] }} table
 * @returns {object} pdfmake content node
 */
export function tableToPdfMake(table) {
  if (!table || !Array.isArray(table.headers) || table.headers.length === 0) {
    throw new Error("tableToPdfMake: table.headers must be a non-empty array");
  }
  const colCount = table.headers.length;

  const badRow = table.rows.find((row) => row.length !== colCount);
  if (badRow) {
    throw new Error(
      `tableToPdfMake: row has ${badRow.length} cells but there are ${colCount} headers — ` +
        `every row must have exactly one cell per header.`
    );
  }

  // First and last columns flex, middle columns size to content — and the
  // array is always exactly colCount long, which is the actual fix.
  const widths = table.headers.map((_, i) => (i === 0 || i === colCount - 1 ? "*" : "auto"));

  return {
    style: "table",
    table: {
      headerRows: 1,
      widths,
      body: [
        table.headers.map((h) => ({ text: h, style: "tableHeader" })),
        ...table.rows.map((row) => row.map((cell) => ({ text: String(cell), style: "tableCell" }))),
      ],
    },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? COLORS.green : rowIndex % 2 === 0 ? COLORS.bg : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => COLORS.hairline,
    },
    margin: [0, 4, 0, 14],
  };
}