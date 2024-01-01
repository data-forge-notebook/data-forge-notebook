import { dedent } from './dedent'; // Import the dedent function from your code

describe('dedent', () => {

    test('should remove common leading whitespace from multiline strings', () => {
        const input = dedent`
          This is an indented
          multiline string.
          The indentation is not included in the string itself.
        `;

        const expectedOutput = `This is an indented\nmultiline string.\nThe indentation is not included in the string itself.`;

        expect(input).toEqual(expectedOutput);
    });

    test('should handle indented templates with variable values', () => {
        const name = 'John';
        const age = 30;

        const input = dedent`
            Name: ${name}
            Age: ${age}
        `;

        const expectedOutput = `Name: John\nAge: 30`;

        expect(input).toEqual(expectedOutput);
    });

    test('should handle templates with no common leading whitespace', () => {
        const input = dedent`
        Line 1
        Line 2
        Line 3
        `;

        const expectedOutput = `Line 1\nLine 2\nLine 3`;

        expect(input).toEqual(expectedOutput);
    });

    test('only removes common leading whitespace', () => {
        const input = dedent`
        Line 1
            Line 2
                Line 3
        `;

        const expectedOutput = `Line 1\n    Line 2\n        Line 3`;

        expect(input).toEqual(expectedOutput);
    });

    test('can dedent code', () => {
        const dedented = dedent`
            (async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { "use strict";

            const wrapperFn = async function () {
              __cell(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", async () => {
                console.log("Hello JavaScript!");
                __capture_locals(0, "e9fe6a22-76df-11e9-b6bb-81a2f4ed2364", () => ({}));
                __end();
              });
            }; await wrapperFn(); })
        `;

        const expected = "(async function (require, __filename, __dirname, display, __cell, __end, __capture_locals, __auto_display) { \"use strict\";\n\nconst wrapperFn = async function () {\n  __cell(0, \"e9fe6a22-76df-11e9-b6bb-81a2f4ed2364\", async () => {\n    console.log(\"Hello JavaScript!\");\n    __capture_locals(0, \"e9fe6a22-76df-11e9-b6bb-81a2f4ed2364\", () => ({}));\n    __end();\n  });\n}; await wrapperFn(); })";
        expect(dedented).toEqual(expected);
    });
});
