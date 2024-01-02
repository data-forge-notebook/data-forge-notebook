
//
// Deindent a multiline JavaScript tring.
//
// Thanks ChatGPT.
//
export function dedent(strings: TemplateStringsArray, ...values: any[]): string {
    // Join the strings and values using a special marker.
    let result = strings.reduce((acc, str, i) => acc + values[i - 1] + str);
  
    // Split the result into lines.
    const lines = result.split('\n');
  
    // Find the minimum leading whitespace common to all lines.
    const commonIndent = lines
      .filter(line => line.trim() !== '') // Exclude empty lines
      .reduce((minIndent, line) => {
        const match = line.match(/^\s*/);
        return match ? Math.min(minIndent, match[0].length) : minIndent;
      }, Infinity);
  
    // Remove the common indent from all lines.
    const dedentedLines = lines.map(line => line.slice(commonIndent));
  
    // Join the dedented lines back together.
    result = dedentedLines.join('\n');

    // Trim the result.
    result = result.trim();
  
    return result;
}