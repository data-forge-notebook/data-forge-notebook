import { IFilePosition, ISourceMap, mergeSourceMaps, parseMappings, serializeMappings, SourceMap, SourceMapGenerator } from "..";
import * as jqSourceMap from "./jquery-2.0.3.min.map.json";

describe("test suite", () => {

    //
    // This test derived from here:
    //
    //  https://github.com/go-sourcemap/sourcemap/blob/180fcef48034918dd59a8920b0d1f5f12e4830de/mappings_test.go#L8
    //
    it("can parse mappings", () => {

        const mappings = ";;;;;;kBAEe,YAAY,CAC1B,C;;AAHD";
        const result = parseMappings(mappings);

        expect(result).toEqual([
            { genLine: 7, genColumn: 18, sourceLine: 3, sourceColumn: 15, sourceFileIndex: 0, namesIndex: undefined },
            { genLine: 7, genColumn: 30, sourceLine: 3, sourceColumn: 27, sourceFileIndex: 0, namesIndex: undefined },
            { genLine: 7, genColumn: 31, sourceLine: 4, sourceColumn: 1, sourceFileIndex: 0, namesIndex: undefined },
            { genLine: 7, genColumn: 32, sourceLine: 4, sourceColumn: 1, sourceFileIndex: 0, namesIndex: undefined },
            { genLine: 9, genColumn: 0, sourceLine: 1, sourceColumn: 0, sourceFileIndex: 0, namesIndex: undefined },
        ]);
    });

    it("can serialize mappings", () => {

        const result = serializeMappings([
            { genLine: 7, genColumn: 18, sourceLine: 3, sourceColumn: 15, sourceFileIndex: 0, nameIndex: undefined },
            { genLine: 7, genColumn: 30, sourceLine: 3, sourceColumn: 27, sourceFileIndex: 0, nameIndex: undefined },
            { genLine: 7, genColumn: 31, sourceLine: 4, sourceColumn: 1, sourceFileIndex: 0, nameIndex: undefined },
            { genLine: 7, genColumn: 32, sourceLine: 4, sourceColumn: 1, sourceFileIndex: 0, nameIndex: undefined },
            { genLine: 9, genColumn: 0, sourceLine: 1, sourceColumn: 0, sourceFileIndex: 0, nameIndex: undefined },
        ]);
        expect(result).toEqual(";;;;;;kBAEe,YAAY,CAC1B,CAAA;;AAHD");
    })

    //
    // Following tests derived from here: https://github.com/go-sourcemap/sourcemap/blob/master/consumer_test.go
    //

    const oneSourceContent = `ONE.foo = function (bar) {
        return baz(bar);
    };`;

    const twoSourceContent = `TWO.inc = function (n) {
        return n + 1;
    };`;

    const sourceMap = {
        "version": 3,
        "file": "min.js",
        "sources": ["one.js", "two.js"],
        "sourcesContent": [oneSourceContent, twoSourceContent],
        "sourceRoot": "/the/root",
        "names": ["bar", "baz", "n"],
        "mappings": "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA"
    };

    function runTest(sourceMapData: any, test: any[], name: string, testNo: number) {
        const sourceMap = new SourceMap(sourceMapData);

        it(`source map test ${testNo}`, () => {

            //todo: this wants some restructuring.
            const genPosition = test[0] as IFilePosition;
            const wantedSource = test[1] as string;
            const wantedName = test[2] as string;
            const sourcePosition = test[3] as IFilePosition;

            const sourceLocation = sourceMap.map(genPosition);
            if (sourceLocation === undefined) {
                if (wantedSource === ""
                    && wantedName === undefined
                    && sourcePosition.line === 0
                    && sourcePosition.column === 0) {
                    return; // All good, didn't want a result.
                }

                throw new Error(`Source not found for test [${testNo}]: ${test}`);
            }

            expect(sourceLocation.source).toEqual(wantedSource);
            expect(sourceLocation.name).toEqual(wantedName);
            expect(sourceLocation.position.line).toEqual(sourcePosition.line);
            expect(sourceLocation.position.column).toEqual(sourcePosition.column);
        });
    }

    const tests: any = [
        [{ line: 1, column: 1 }, "/the/root/one.js", undefined, { line: 1, column: 1 }],

        [{ line: 1, column: 5 }, "/the/root/one.js", undefined, { line: 1, column: 5 }],
        [{ line: 1, column: 9 }, "/the/root/one.js", undefined, { line: 1, column: 11 }],
        [{ line: 1, column: 18 }, "/the/root/one.js", "bar", { line: 1, column: 21 }],
        [{ line: 1, column: 21 }, "/the/root/one.js", undefined, { line: 2, column: 3 }],
        [{ line: 1, column: 28 }, "/the/root/one.js", "baz", { line: 2, column: 10 }],
        [{ line: 1, column: 32 }, "/the/root/one.js", "bar", { line: 2, column: 14 }],

        [{ line: 2, column: 1 }, "/the/root/two.js", undefined, { line: 1, column: 1 }],
        [{ line: 2, column: 5 }, "/the/root/two.js", undefined, { line: 1, column: 5 }],
        [{ line: 2, column: 9 }, "/the/root/two.js", undefined, { line: 1, column: 11 }],
        [{ line: 2, column: 18 }, "/the/root/two.js", "n", { line: 1, column: 21 }],
        [{ line: 2, column: 21 }, "/the/root/two.js", undefined, { line: 2, column: 3 }],
        [{ line: 2, column: 28 }, "/the/root/two.js", "n", { line: 2, column: 10 }],

        // line correct, column bigger than last mapping
        [{ line: 2, column: 29 }, "/the/root/two.js", "n", { line: 2, column: 10 }],

        // Fuzzy match.
        [{ line: 1, column: 20 }, "/the/root/one.js", "bar", { line: 1, column: 21 }],
        [{ line: 1, column: 30 }, "/the/root/one.js", "baz", { line: 2, column: 10 }],
        [{ line: 2, column: 12 }, "/the/root/two.js", undefined, { line: 1, column: 11 }],
    ];

    let testNo = 1;
    for (const test of tests) {
        runTest(sourceMap, test, "sourceMap", testNo);
        testNo += 1;
    }

    const jqTests: any = [
        [{ line: 1, column: 1 }, "", undefined, { line: 0, column: 0 }],
		[{ line: 4, column: 0 }, "", undefined, { line: 0, column: 0 }],
		[{ line: 4, column: 1 }, "jquery-2.0.3.js", undefined, { line: 14, column: 0 }],
		[{ line: 4, column: 10 }, "jquery-2.0.3.js", "window", { line: 14, column: 11 }],
		[{ line: 5, column: 6789 }, "jquery-2.0.3.js", "apply", { line: 4360, column: 27 }],
		[{ line: 5, column: 10006 }, "jquery-2.0.3.js", "apply", { line: 4676, column: 8 }],
		[{ line: 4, column: 553 }, "jquery-2.0.3.js", "ready", { line: 93, column: 9 }],
		[{ line: 999999, column: 0 }, "", undefined, { line: 0, column: 0 }],
    ];

    testNo = 1;
    for (const test of jqTests) {
        runTest(jqSourceMap, test, "jqSourceMap", testNo);
        testNo += 1;
    }

    //
    // The following tests derived from https://github.com/mozilla/source-map/tree/master/test
    //

    const testMap = { // Same as above!
        version: 3,
        file: "min.js",
        names: ["bar", "baz", "n"],
        sources: ["one.js", "two.js"],
        sourceRoot: "/the/root",
        mappings:
            "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA"
    };

    const testMapNoSourceRoot = {
        version: 3,
        file: "min.js",
        names: ["bar", "baz", "n"],
        sources: ["one.js", "two.js"],
        mappings:
            "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA"
    };

    const testMapEmptySourceRoot = {
        version: 3,
        file: "min.js",
        names: ["bar", "baz", "n"],
        sources: ["one.js", "two.js"],
        sourceRoot: "",
        mappings:
            "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA"
    };

    it("test that the source root is reflected in a mapping's source field", () => {

        const sourceMap = new SourceMap(testMap);
        const sourceLocation1 = sourceMap.map({ line: 2, column: 1 });
        expect(sourceLocation1?.source).toEqual("/the/root/two.js");

        const sourceLocation2 = sourceMap.map({ line: 1, column: 1 });
        expect(sourceLocation2?.source).toEqual("/the/root/one.js");

        const sourceMapNoSourceRoot = new SourceMap(testMapNoSourceRoot);
        const sourceLocation3 = sourceMapNoSourceRoot.map({ line: 2, column: 1 });
        expect(sourceLocation3?.source).toEqual("two.js");

        const sourceLocation4 = sourceMapNoSourceRoot.map({ line: 1, column: 1 });
        expect(sourceLocation4?.source).toEqual("one.js");

        const sourceMapEmptySourceRoot = new SourceMap(testMapEmptySourceRoot);
        const sourceLocation5 = sourceMapNoSourceRoot.map({ line: 2, column: 1 });
        expect(sourceLocation5?.source).toEqual("two.js");

        const sourceLocation6 = sourceMapNoSourceRoot.map({ line: 1, column: 1 });
        expect(sourceLocation6?.source).toEqual("one.js");
    });

    function expectMapping(sourceMap: ISourceMap, genPosition: IFilePosition, sourceFile: string, sourcePosition: IFilePosition, name?: string): void {
        const sourceLocation = sourceMap.map(genPosition);
        expect(sourceLocation?.source).toEqual(sourceFile);
        expect(sourceLocation?.position.line).toEqual(sourcePosition.line);
        expect(sourceLocation?.position.column).toEqual(sourcePosition.column);

        if (name) {
            expect(sourceLocation?.name).toEqual(name);
        }
    }

    it("test mapping tokens back exactly", () => {

        const sourceMap = new SourceMap(testMap);
        expectMapping(sourceMap, { line: 1, column: 1 }, "/the/root/one.js", { line: 1, column: 1 });
        expectMapping(sourceMap, { line: 1, column: 5 }, "/the/root/one.js", { line: 1, column: 5 });
        expectMapping(sourceMap, { line: 1, column: 9 }, "/the/root/one.js", { line: 1, column: 11 });
        expectMapping(sourceMap, { line: 1, column: 18 }, "/the/root/one.js", { line: 1, column: 21 }, "bar");
        expectMapping(sourceMap, { line: 1, column: 21 }, "/the/root/one.js", { line: 2, column: 3 });
        expectMapping(sourceMap, { line: 1, column: 28 }, "/the/root/one.js", { line: 2, column: 10 }, "baz");
        expectMapping(sourceMap, { line: 1, column: 32 }, "/the/root/one.js", { line: 2, column: 14 }, "bar");

        expectMapping(sourceMap, { line: 2, column: 1 }, "/the/root/two.js", { line: 1, column: 1 });
        expectMapping(sourceMap, { line: 2, column: 5 }, "/the/root/two.js", { line: 1, column: 5 });
        expectMapping(sourceMap, { line: 2, column: 9 }, "/the/root/two.js", { line: 1, column: 11 });
        expectMapping(sourceMap, { line: 2, column: 18 }, "/the/root/two.js", { line: 1, column: 21 }, "n");
        expectMapping(sourceMap, { line: 2, column: 21 }, "/the/root/two.js", { line: 2, column: 3 });
        expectMapping(sourceMap, { line: 2, column: 28 }, "/the/root/two.js", { line: 2, column: 10 }, "n");
    });

    it("test github issue #72, duplicate sources", () => {
        const sourceMap = new SourceMap({
            version: 3,
            file: "foo.js",
            sources: ["source1.js", "source1.js", "source3.js"],
            names: [],
            mappings: ";EAAC;;IAEE;;MEEE",
            sourceRoot: "http://example.com"
        });

        let sourceLocation = sourceMap.map({
            line: 2,
            column: 2,
        });
        expect(sourceLocation?.source).toEqual("http://example.com/source1.js");
        expect(sourceLocation?.position.line).toEqual(1);
        expect(sourceLocation?.position.column).toEqual(1);
        
        sourceLocation = sourceMap.map({
            line: 4,
            column: 4
        });
        expect(sourceLocation?.source).toEqual("http://example.com/source1.js");
        expect(sourceLocation?.position.line).toEqual(3);
        expect(sourceLocation?.position.column).toEqual(3);
        
        sourceLocation = sourceMap.map({
            line: 6,
            column: 6
        });
        expect(sourceLocation?.source).toEqual("http://example.com/source3.js");
        expect(sourceLocation?.position.line).toEqual(5);
        expect(sourceLocation?.position.column).toEqual(5);

    });

    it("test github issue #72, duplicate sources", () => {
        const sourceMap = new SourceMap({
            version: 3,
            file: "foo.js",
            sources: ["source.js"],
            names: ["name1", "name1", "name3"],
            mappings: ";EAACA;;IAEEA;;MAEEE",
            sourceRoot: "http://example.com"
        });

        let sourceLocation = sourceMap.map({
            line: 2,
            column: 2,
        });
        expect(sourceLocation?.name).toEqual("name1");
        expect(sourceLocation?.position.line).toEqual(1);
        expect(sourceLocation?.position.column).toEqual(1);
    
        sourceLocation = sourceMap.map({
            line: 4,
            column: 4,
        });
        expect(sourceLocation?.name).toEqual("name1");
        expect(sourceLocation?.position.line).toEqual(3);
        expect(sourceLocation?.position.column).toEqual(3);
    
        sourceLocation = sourceMap.map({
            line: 6,
            column: 6,
        });
        expect(sourceLocation?.name).toEqual("name3");
        expect(sourceLocation?.position.line).toEqual(5);
        expect(sourceLocation?.position.column).toEqual(5);
    });

    //
    // The following tests derived from here: https://github.com/thlorenz/inline-source-map/blob/master/test/inline-source-map.js
    //

    const fooSourceCode = '' + function foo () {
        var hello = 'hello';
        var world = 'world';
        console.log('%s %s', hello, world);
    }

    const barSourceCode = '' + function bar () {
        console.log('yes?');
    }
      

    it("one file no offset", () => {

        const generator = new SourceMapGenerator();
        generator.addMappings("foo.js", fooSourceCode, { line: 0, column: 0 });
        expect(generator.getSources()).toEqual(["foo.js"]);
        expect(generator.getMappings()).toEqual([ 
            { 
                genLine: 1,
                genColumn: 0,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 2,
                genColumn: 0,
                sourceLine: 2,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 3,
                genColumn: 0,
                sourceLine: 3,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            {
                genLine: 4,
                genColumn: 0,
                sourceLine: 4,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 5,
                genColumn: 0,
                sourceLine: 5,
                sourceColumn: 0,
                sourceFileIndex: 0,
            }, 
        ]);
    });

    it("two files no offset", () => {
        const generator = new SourceMapGenerator();
        generator.addMappings("foo.js", fooSourceCode, { line: 0, column: 0 });
        generator.addMappings("bar.js", barSourceCode, { line: 0, column: 0 });
        expect(generator.getSources()).toEqual(["foo.js", "bar.js"]);
        expect(generator.getMappings()).toEqual([ 
            { 
                genLine: 1,
                genColumn: 0,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 2,
                genColumn: 0,
                sourceLine: 2,
                sourceColumn: 0,
                sourceFileIndex: 0,   
            },
            { 
                genLine: 3,
                genColumn: 0,
                sourceLine: 3,
                sourceColumn: 0,
                sourceFileIndex: 0,   
            },
            { 
                genLine: 4,
                genColumn: 0,
                sourceLine: 4,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 5,
                genColumn: 0,
                sourceLine: 5,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 1,
                genColumn: 0,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
            { 
                genLine: 2,
                genColumn: 0,
                sourceLine: 2,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
            { 
                genLine: 3,
                genColumn: 0,
                sourceLine: 3,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
        ]);
    });

    it("one line source", () => {
        const generator = new SourceMapGenerator();
        const sourceCode = 'console.log("line one");';
        generator.addMappings("one-liner.js", sourceCode, { line: 0, column: 0 });
        expect(generator.getSources()).toEqual(["one-liner.js"]);
        expect(generator.getMappings()).toEqual([ 
            { 
                genLine: 1,
                genColumn: 0,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 0, 
            },
        ]);
    });

    it("with offset", () => {
        const generator = new SourceMapGenerator();
        generator.addMappings("foo.js", fooSourceCode, { line: 20, column: 0 });
        generator.addMappings("bar.js", barSourceCode, { line: 23, column: 22 });
        expect(generator.getSources()).toEqual(["foo.js", "bar.js"]);
        expect(generator.getMappings()).toEqual([ 
            { 
                genLine: 21,
                genColumn: 0,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 22,
                genColumn: 0,
                sourceLine: 2,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 23,
                genColumn: 0,
                sourceLine: 3,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 24,
                genColumn: 0,
                sourceLine: 4,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },  
            { 
                genLine: 25,
                genColumn: 0,
                sourceLine: 5,
                sourceColumn: 0,
                sourceFileIndex: 0,
            },
            { 
                genLine: 24,
                genColumn: 22,
                sourceLine: 1,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
            { 
                genLine: 25,
                genColumn: 22,
                sourceLine: 2,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
            { 
                genLine: 26,
                genColumn: 22,
                sourceLine: 3,
                sourceColumn: 0,
                sourceFileIndex: 1,
            },
        ]);
    });

    //
    // The following tests derived from here: https://github.com/mozilla/source-map/blob/master/test/test-source-map-generator.js
    //

    it("test that the correct mappings are being generated", () => {
        const map = new SourceMapGenerator({
            file: "min.js",
            sourceRoot: "/the/root"
        });
        
        map.addMapping(
            { line: 1, column: 1 },
            { 
                position: { line: 1, column: 1 },
                source: "one.js",
            }
        );
        map.addMapping(
            { line: 1, column: 5 },
            { 
                position: { line: 1, column: 5 },
                source: "one.js",
            }
        );
        map.addMapping(
            { line: 1, column: 9 },
            {
                position: { line: 1, column: 11 },
                source: "one.js",
            }
        );

        map.addMapping(
            { line: 1, column: 18 },
            {
                position: { line: 1, column: 21 },
                source: "one.js",
                name: "bar",
            }
        );

        map.addMapping(
            { line: 1, column: 21 },
            {
                position: { line: 2, column: 3 },
                source: "one.js",
            },
        );

        map.addMapping(
            { line: 1, column: 28 },
            {
                position: { line: 2, column: 10 },
                source: "one.js",
                name: "baz",
            },
        );

        map.addMapping(
            { line: 1, column: 32 },
            {
                position: { line: 2, column: 14 },
                source: "one.js",
                name: "bar",
            }
        );

        map.addMapping(
            { line: 2, column: 1 },
            {
                position: { line: 1, column: 1 },
                source: "two.js",
            }
        );
    
        map.addMapping(
            { line: 2, column: 5 },
            {
                position: { line: 1, column: 5 },
                source: "two.js",
            }
        );

        map.addMapping(
            { line: 2, column: 9 },
            {
                position: { line: 1, column: 11 },
                source: "two.js",
            }
        );

        map.addMapping(
            { line: 2, column: 18 },
            {
                position: { line: 1, column: 21 },
                source: "two.js",
                name: "n",
            }
        );

        map.addMapping(
            { line: 2, column: 21 },
            {
                position: { line: 2, column: 3 },
                source: "two.js",
            }
        );

        map.addMapping(
            { line: 2, column: 28 },
            {
                position: { line: 2, column: 10 },
                source: "two.js",
                name: "n",
            }
        );

        const generatedSourceMap = map.serialize();
        expect(generatedSourceMap).toEqual(testMap);
    });

    test("can merge source maps", () => {

        const sourceMapData1 = {
            "version": 3,
            "sources": [
                "cell-f3c08f51-24e3-11e9-a63a-c97fe03898f5"
            ],
            "names": [],
            "mappings": ";;CAAA;CACA;CACA;CACA;CACA",
            "file": "",
            "sourceRoot": ""
        };

        const sourceMapData2 = {
            "version": 3,
            "file": "in-memory-file.js",
            "sourceRoot": "",
            "sources": [
                "in-memory-file.ts"
            ],
            "names": [],
            "mappings": ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAAA,CAAC,UAAgB,OAAiB,EAAE,UAAkB,EAAE,SAAiB,EAAE,OAAiB,EAAE,mBAA6B,EAAE,iBAA2B;;QAEpJ,SAAS,eAAe,CAAC,IAAY;YACjC,OAAO,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC;QACtB,CAAC;;YAHL,mBAAmB,CAAC,sCAAsC,CAAC,CAAC;YAKxD,eAAe,CAAC,mBAAmB,CAAC,CAAC;YACzC,iBAAiB,CAAC,sCAAsC,CAAC,CAAC;;;;CAEzD,CAAC,CAAA"
        };

        const mergeSourceMapData = mergeSourceMaps(sourceMapData1, sourceMapData2);
        expect(mergeSourceMapData).toEqual( {
            "version": 3,
            "sources": [
                "cell-f3c08f51-24e3-11e9-a63a-c97fe03898f5",
                "in-memory-file.ts"
            ],
            "names": [],
            "mappings": ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;QAAA,SAAA,eAAA,CAAA,IAAA;YACA,OAAA,CAAA,GAAA,CAAA,IAAA,CAAA,CAAA;QACA,CAAA;;;YAEA,eAAA,CAAA,mBAAA,CAAA,CAAA",
            "file": "",
            "sourceRoot": ""
        });
    });
});
