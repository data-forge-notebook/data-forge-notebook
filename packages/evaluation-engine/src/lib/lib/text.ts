
//
// Compute the number of lines in some code.
//
export function computeNumLines(code: string): number {
    let numLines = 0;
    for (let i = 0; i < code.length; ++i) {
        if (code[i] == '\n') {
            numLines++;
        }
    }

    return numLines;
}
