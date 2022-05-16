import { CellScope, CellType } from "./model/cell";
import { ISerializedNotebook1 } from "./model/serialization/serialized1";

export const testNotebook: ISerializedNotebook1 = {
    "version": 2,
    "language": "javascript",
    "cells": [
        {
            "id": "d0647090-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "# Examples of visualization\r\n\r\nThere's many ways to visualize your data in Data-Forge Notebook, lets look at a few here.",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 115
        },
        {
            "id": "ea3ea260-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## Plain ole' console logging\r\n\r\nUse `console.log` to output whatever you want:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "f0627130-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = \"Whatever you want to log!\";\r\nconsole.log(data);",
            "lastEvaluationDate": "2020-06-22T17:23:59.889+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "string",
                        "data": "Whatever you want to log!\n"
                    }
                }
            ],
            "errors": [],
            "height": 106
        },
        {
            "id": "dd75ede0-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## JavaScript array\r\n\r\nWe can use the `display` function for formatted data visualization. \r\n\r\nWe can use it to visualize JavaScript arrays:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 131
        },
        {
            "id": "1b752e00-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = [1, 2, 3, 4];\r\ndisplay(data);",
            "lastEvaluationDate": "2020-06-22T17:24:07.844+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "array",
                        "data": [
                            1,
                            2,
                            3,
                            4
                        ]
                    }
                }
            ],
            "errors": [],
            "height": 199
        },
        {
            "id": "e33a5ea0-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## JavaScript object\r\n\r\nWe can also use the `display` function to visualize JavaScript objects:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "27b6d830-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = { A: 1, B: \"hello\" };\r\ndisplay(data);",
            "lastEvaluationDate": "2020-06-22T17:24:08.138+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "object",
                        "data": {
                            "A": 1,
                            "B": "hello"
                        }
                    }
                }
            ],
            "errors": [],
            "height": 159
        },
        {
            "id": "02b6d330-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## JavaScript object as table\r\n\r\nWe can use `display.table` to visualize a JavaScript object as tabular data:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "c6a99850-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = { A: 1, B: \"hello\" };\r\ndisplay.table(data);",
            "lastEvaluationDate": "2020-06-22T17:24:08.431+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "table",
                        "data": {
                            "columnNames": [
                                "Property",
                                "Value"
                            ],
                            "rows": [
                                {
                                    "Property": "A",
                                    "Value": 1
                                },
                                {
                                    "Property": "B",
                                    "Value": "hello"
                                }
                            ]
                        }
                    }
                }
            ],
            "errors": [],
            "height": 182
        },
        {
            "id": "466a7d20-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Markdown,
            "code": "## JavaScript array as table\r\n\r\nWe can also use `display.table` to visualize a JavaScript array as tabular data.",
            "lastEvaluationDate": "2019-10-21T16:48:16.310+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "6570d750-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = [{ A: 1, B: \"Hello\" }, { A: 2, B: \"Computer!\" }];\r\ndisplay.table(data);",
            "lastEvaluationDate": "2020-06-22T17:24:09.425+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "table",
                        "data": {
                            "rows": [
                                {
                                    "A": 1,
                                    "B": "Hello"
                                },
                                {
                                    "A": 2,
                                    "B": "Computer!"
                                }
                            ],
                            "columnNames": [
                                "A",
                                "B"
                            ]
                        }
                    }
                }
            ],
            "errors": [],
            "height": 182
        },
        {
            "id": "6743dc40-fb65-11e9-b87a-47633ef72d4e",
            "cellType": CellType.Markdown,
            "code": "## JSON data\r\n\r\nUse `display.json` to render textual JSON data without having to parse it.",
            "lastEvaluationDate": "2019-10-31T08:36:01.792+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "74ae4f00-fb65-11e9-b87a-47633ef72d4e",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "const data = '[ { \"A\": 1, \"B\": \"Hello\" }, { \"A\": 2, \"B\": \"Computer!\" } ]';\r\ndisplay.json(data);",
            "lastEvaluationDate": "2020-06-22T17:24:09.808+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "json",
                        "data": "[ { \"A\": 1, \"B\": \"Hello\" }, { \"A\": 2, \"B\": \"Computer!\" } ]"
                    }
                }
            ],
            "errors": [],
            "height": 267
        },
        {
            "id": "092f78c0-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## HTML!\r\n\r\nThen there's `display.html` that we can use to render formatted HTML:",
            "lastEvaluationDate": "2019-02-12T18:06:37.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "2c625ee0-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = \"<h1>This is HTML</h1>\";\r\ndisplay.html(data);",
            "lastEvaluationDate": "2020-06-22T17:24:10.098+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "html",
                        "data": "<h1>This is HTML</h1>"
                    }
                }
            ],
            "errors": [],
            "height": 244
        },
        {
            "id": "29b4e360-fb65-11e9-b87a-47633ef72d4e",
            "cellType": CellType.Markdown,
            "code": "## Markdown!\r\n\r\nUse `display.markdown` to render formatted markdown to cell output.",
            "lastEvaluationDate": "2019-10-31T08:36:01.792+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "3f1b1940-fb65-11e9-b87a-47633ef72d4e",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "const data = \"## Markdown baby ;)\\nSome great markdown right here.\";\r\ndisplay.markdown(data);",
            "lastEvaluationDate": "2020-06-22T17:24:10.479+10:00",
            "output": [
                {
                    "value": {
                        "displayType": CellType.Markdown,
                        "data": "## Markdown baby ;)\nSome great markdown right here."
                    }
                }
            ],
            "errors": [],
            "height": 169
        },
        {
            "id": "abc0e040-f4ab-11e9-bc75-6b676fbda00a",
            "cellType": CellType.Markdown,
            "code": "## Preformatted text\r\n\r\nUse `display.text` to print pre-formatted text to cell output.",
            "lastEvaluationDate": "2019-10-22T19:10:51.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "c01509e0-f4ab-11e9-bc75-6b676fbda00a",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const someText = \"Hello!\\nThis is some preformatted text with newlines baked in :)\";\r\ndisplay.text(someText);",
            "lastEvaluationDate": "2020-06-22T17:24:10.845+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "text",
                        "data": "Hello!\nThis is some preformatted text with newlines baked in :)"
                    }
                }
            ],
            "errors": [],
            "height": 143
        },
        {
            "id": "0ee8ed00-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## Preview data from CSV file\r\n\r\nUse the [datakit](https://www.npmjs.com/package/datakit) library to read CSV and preview with the `display.table` function.",
            "lastEvaluationDate": "2019-02-12T18:06:37.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "31ae9260-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const datakit = require('datakit');\r\nconst data = await datakit.readCsv(\"./example.csv\");\r\ndisplay.table(data.slice(0, 5));",
            "lastEvaluationDate": "2020-06-22T17:24:12.040+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "table",
                        "data": {
                            "rows": [
                                {
                                    "Name": "Alex",
                                    "Sex": "M",
                                    "Age": 41,
                                    "Height (in)": 74,
                                    "Weight (lbs)": 170
                                },
                                {
                                    "Name": "Bert",
                                    "Sex": "M",
                                    "Age": 42,
                                    "Height (in)": 68,
                                    "Weight (lbs)": 166
                                },
                                {
                                    "Name": "Carl",
                                    "Sex": "M",
                                    "Age": 32,
                                    "Height (in)": 70,
                                    "Weight (lbs)": 155
                                },
                                {
                                    "Name": "Dave",
                                    "Sex": "M",
                                    "Age": 39,
                                    "Height (in)": 72,
                                    "Weight (lbs)": 167
                                },
                                {
                                    "Name": "Elly",
                                    "Sex": "F",
                                    "Age": 30,
                                    "Height (in)": 66,
                                    "Weight (lbs)": 124
                                }
                            ],
                            "columnNames": [
                                "Name",
                                "Sex",
                                "Age",
                                "Height (in)",
                                "Weight (lbs)"
                            ]
                        }
                    }
                }
            ],
            "errors": [],
            "height": 289
        },
        {
            "id": "c5c26fb0-1335-11ea-ba9f-279dfd8c67c3",
            "cellType": CellType.Markdown,
            "code": "## Preview data from JSON file\r\n\r\nUse the [datakit](https://www.npmjs.com/package/datakit) library to read JSON and preview with the `display.table` function.",
            "lastEvaluationDate": "2019-11-30T15:55:19.803+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "d0e47910-1335-11ea-ba9f-279dfd8c67c3",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "const datakit = require('datakit');\r\nconst data = await datakit.readJson(\"./example.json\");\r\ndisplay.table(data.slice(0, 3));",
            "lastEvaluationDate": "2020-06-22T17:24:12.323+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "table",
                        "data": {
                            "rows": [
                                {
                                    "Name": "Alex",
                                    "Sex": "M",
                                    "Age": 41,
                                    "Height (in)": 74,
                                    "Weight (lbs)": 170
                                },
                                {
                                    "Name": "Bert",
                                    "Sex": "M",
                                    "Age": 42,
                                    "Height (in)": 68,
                                    "Weight (lbs)": 166
                                },
                                {
                                    "Name": "Carl",
                                    "Sex": "M",
                                    "Age": 32,
                                    "Height (in)": 70,
                                    "Weight (lbs)": 155
                                }
                            ],
                            "columnNames": [
                                "Name",
                                "Sex",
                                "Age",
                                "Height (in)",
                                "Weight (lbs)"
                            ]
                        }
                    }
                }
            ],
            "errors": [],
            "height": 229
        },
        {
            "id": "fc067e40-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Markdown,
            "code": "## Charts: Plot any ole JavaScript data!\r\n\r\nEasily create charts from JavaScript data using the function `display.plot`.\r\n\r\n### Plot arrays of numbers",
            "lastEvaluationDate": "2019-10-21T16:48:16.310+10:00",
            "output": [],
            "errors": [],
            "height": 147
        },
        {
            "id": "f879ae00-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = [50, 20, 10, 40, 15, 25];\r\ndisplay.plot(data);",
            "lastEvaluationDate": "2020-06-22T17:24:12.591+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "plot",
                        "data": {
                            "data": {
                                "series": {
                                    "y": {
                                        "type": "number",
                                        "values": [
                                            50,
                                            20,
                                            10,
                                            40,
                                            15,
                                            25
                                        ]
                                    }
                                }
                            },
                            "plotConfig": {
                                "legend": {
                                    "show": false
                                },
                                "chartType": "line",
                                "width": "95%",
                                "height": "95%",
                                "y": {
                                    "min": 10,
                                    "max": 50
                                },
                                "y2": {}
                            },
                            "axisMap": {
                                "y": [
                                    {
                                        "series": "y"
                                    }
                                ],
                                "y2": []
                            }
                        }
                    }
                }
            ],
            "errors": [],
            "height": 491
        },
        {
            "id": "21231020-1332-11ea-b4ba-813ffa5b9c8b",
            "cellType": CellType.Markdown,
            "code": "### Plot arrays of JavaScript objects",
            "lastEvaluationDate": "2019-11-30T15:33:11.656+10:00",
            "output": [],
            "errors": [],
            "height": 65
        },
        {
            "id": "24ef35e0-f3ce-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const data = [{ D1: 50, D2: 30 }, { D1: 20, D2: 200 }, { D1: 10, D2: 100 }, { D1: 40, D2: 400 }];\r\ndisplay.plot(data);",
            "lastEvaluationDate": "2020-06-22T17:24:12.895+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "plot",
                        "data": {
                            "data": {
                                "series": {
                                    "D1": {
                                        "type": "number",
                                        "values": [
                                            50,
                                            20,
                                            10,
                                            40
                                        ]
                                    },
                                    "D2": {
                                        "type": "number",
                                        "values": [
                                            30,
                                            200,
                                            100,
                                            400
                                        ]
                                    }
                                }
                            },
                            "plotConfig": {
                                "legend": {
                                    "show": true
                                },
                                "chartType": "line",
                                "width": "95%",
                                "height": "95%",
                                "y": {
                                    "min": 10,
                                    "max": 400
                                },
                                "y2": {}
                            },
                            "axisMap": {
                                "y": [
                                    {
                                        "series": "D1"
                                    },
                                    {
                                        "series": "D2"
                                    }
                                ],
                                "y2": []
                            }
                        }
                    }
                }
            ],
            "errors": [],
            "height": 491
        },
        {
            "id": "67178a70-1332-11ea-b4ba-813ffa5b9c8b",
            "cellType": CellType.Markdown,
            "code": "## Plot by column!",
            "lastEvaluationDate": "2019-11-30T15:33:11.656+10:00",
            "output": [],
            "errors": [],
            "height": 73
        },
        {
            "id": "48cae350-1332-11ea-b4ba-813ffa5b9c8b",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "const data = {\r\n    D1: [30, 10, 50, 15],\r\n    D2: [300, 20, 10, 150],\r\n};\r\ndisplay.plot(data);",
            "lastEvaluationDate": "2020-06-22T17:24:13.179+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "plot",
                        "data": {
                            "data": {
                                "series": {
                                    "D1": {
                                        "type": "number",
                                        "values": [
                                            30,
                                            10,
                                            50,
                                            15
                                        ]
                                    },
                                    "D2": {
                                        "type": "number",
                                        "values": [
                                            300,
                                            20,
                                            10,
                                            150
                                        ]
                                    }
                                }
                            },
                            "plotConfig": {
                                "legend": {
                                    "show": true
                                },
                                "chartType": "line",
                                "width": "95%",
                                "height": "95%",
                                "y": {
                                    "min": 10,
                                    "max": 300
                                },
                                "y2": {}
                            },
                            "axisMap": {
                                "y": [
                                    {
                                        "series": "D1"
                                    },
                                    {
                                        "series": "D2"
                                    }
                                ],
                                "y2": []
                            }
                        }
                    }
                }
            ],
            "errors": [],
            "height": 546
        },
        {
            "id": "13bac060-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## Load and plot CSV and JSON data!\r\n\r\nEasily load and plot CSV and JSON data with help of [datakit](https://www.npmjs.com/package/daki) on npm.",
            "lastEvaluationDate": "2019-02-12T18:06:37.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "3736bd70-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const datakit = require('datakit');\r\nconst data = await datakit.readCsv(\"./example.csv\");\r\ndisplay.plot(data);",
            "lastEvaluationDate": "2020-06-22T17:24:13.431+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "plot",
                        "data": {
                            "data": {
                                "series": {
                                    "Name": {
                                        "type": "string",
                                        "values": [
                                            "Alex",
                                            "Bert",
                                            "Carl",
                                            "Dave",
                                            "Elly",
                                            "Fran",
                                            "Gwen",
                                            "Hank",
                                            "Ivan",
                                            "Jake",
                                            "Kate",
                                            "Luke",
                                            "Myra",
                                            "Neil",
                                            "Omar",
                                            "Page",
                                            "Quin",
                                            "Ruth"
                                        ]
                                    },
                                    "Sex": {
                                        "type": "string",
                                        "values": [
                                            "M",
                                            "M",
                                            "M",
                                            "M",
                                            "F",
                                            "F",
                                            "F",
                                            "M",
                                            "M",
                                            "M",
                                            "F",
                                            "M",
                                            "F",
                                            "M",
                                            "M",
                                            "F",
                                            "M",
                                            "F"
                                        ]
                                    },
                                    "Age": {
                                        "type": "number",
                                        "values": [
                                            41,
                                            42,
                                            32,
                                            39,
                                            30,
                                            33,
                                            26,
                                            30,
                                            53,
                                            32,
                                            47,
                                            34,
                                            23,
                                            36,
                                            38,
                                            31,
                                            29,
                                            28
                                        ]
                                    },
                                    "Height (in)": {
                                        "type": "number",
                                        "values": [
                                            74,
                                            68,
                                            70,
                                            72,
                                            66,
                                            66,
                                            64,
                                            71,
                                            72,
                                            69,
                                            69,
                                            72,
                                            62,
                                            75,
                                            70,
                                            67,
                                            71,
                                            65
                                        ]
                                    },
                                    "Weight (lbs)": {
                                        "type": "number",
                                        "values": [
                                            170,
                                            166,
                                            155,
                                            167,
                                            124,
                                            115,
                                            121,
                                            158,
                                            175,
                                            143,
                                            139,
                                            163,
                                            98,
                                            160,
                                            145,
                                            135,
                                            176,
                                            131
                                        ]
                                    }
                                }
                            },
                            "plotConfig": {
                                "legend": {
                                    "show": true
                                },
                                "chartType": "line",
                                "width": "95%",
                                "height": "95%",
                                "y": {
                                    "min": 23,
                                    "max": 176
                                },
                                "y2": {}
                            },
                            "axisMap": {
                                "y": [
                                    {
                                        "series": "Name"
                                    },
                                    {
                                        "series": "Sex"
                                    },
                                    {
                                        "series": "Age"
                                    },
                                    {
                                        "series": "Height (in)"
                                    },
                                    {
                                        "series": "Weight (lbs)"
                                    }
                                ],
                                "y2": []
                            }
                        }
                    }
                }
            ],
            "errors": [],
            "height": 508
        },
        {
            "id": "913a48b0-1332-11ea-b4ba-813ffa5b9c8b",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "const datakit = require('datakit');\r\nconst data = await datakit.readJson(\"./example.json\");\r\ndisplay.plot(data);",
            "lastEvaluationDate": "2020-06-22T17:24:13.770+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "plot",
                        "data": {
                            "data": {
                                "series": {
                                    "Name": {
                                        "type": "string",
                                        "values": [
                                            "Alex",
                                            "Bert",
                                            "Carl",
                                            "Dave",
                                            "Elly",
                                            "Fran",
                                            "Gwen",
                                            "Hank",
                                            "Ivan",
                                            "Jake",
                                            "Kate",
                                            "Luke",
                                            "Myra",
                                            "Neil",
                                            "Omar",
                                            "Page",
                                            "Quin",
                                            "Ruth"
                                        ]
                                    },
                                    "Sex": {
                                        "type": "string",
                                        "values": [
                                            "M",
                                            "M",
                                            "M",
                                            "M",
                                            "F",
                                            "F",
                                            "F",
                                            "M",
                                            "M",
                                            "M",
                                            "F",
                                            "M",
                                            "F",
                                            "M",
                                            "M",
                                            "F",
                                            "M",
                                            "F"
                                        ]
                                    },
                                    "Age": {
                                        "type": "number",
                                        "values": [
                                            41,
                                            42,
                                            32,
                                            39,
                                            30,
                                            33,
                                            26,
                                            30,
                                            53,
                                            32,
                                            47,
                                            34,
                                            23,
                                            36,
                                            38,
                                            31,
                                            29,
                                            28
                                        ]
                                    },
                                    "Height (in)": {
                                        "type": "number",
                                        "values": [
                                            74,
                                            68,
                                            70,
                                            72,
                                            66,
                                            66,
                                            64,
                                            71,
                                            72,
                                            69,
                                            69,
                                            72,
                                            62,
                                            75,
                                            70,
                                            67,
                                            71,
                                            65
                                        ]
                                    },
                                    "Weight (lbs)": {
                                        "type": "number",
                                        "values": [
                                            170,
                                            166,
                                            155,
                                            167,
                                            124,
                                            115,
                                            121,
                                            158,
                                            175,
                                            143,
                                            139,
                                            163,
                                            98,
                                            160,
                                            145,
                                            135,
                                            176,
                                            131
                                        ]
                                    }
                                }
                            },
                            "plotConfig": {
                                "legend": {
                                    "show": true
                                },
                                "chartType": "line",
                                "width": "95%",
                                "height": "95%",
                                "y": {
                                    "min": 23,
                                    "max": 176
                                },
                                "y2": {}
                            },
                            "axisMap": {
                                "y": [
                                    {
                                        "series": "Name"
                                    },
                                    {
                                        "series": "Sex"
                                    },
                                    {
                                        "series": "Age"
                                    },
                                    {
                                        "series": "Height (in)"
                                    },
                                    {
                                        "series": "Weight (lbs)"
                                    }
                                ],
                                "y2": []
                            }
                        }
                    }
                }
            ],
            "errors": [],
            "height": 508
        },
        {
            "id": "f61e2630-675a-11ea-94da-357be68abebe",
            "cellType": CellType.Markdown,
            "code": "## Visualize geographic data\r\n\r\nUse the `display.geo` function to plot geographic coordinates and GeoJSON!",
            "lastEvaluationDate": "2020-03-16T17:53:11.948+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "f1491e80-675a-11ea-94da-357be68abebe",
            "cellType": CellType.Code,
            "cellScope": CellScope.Global,
            "code": "display.geo({\r\n    location: [51.505, -0.10],\r\n    zoom: 13,\r\n    markers: [\r\n        [51.505, -0.10],\r\n        [51.5, -0.09],\r\n        [51.51, -0.08]\r\n    ],\r\n});",
            "lastEvaluationDate": "2020-06-22T17:24:14.901+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "geo",
                        "data": {
                            "location": [
                                51.505,
                                -0.1
                            ],
                            "zoom": 13,
                            "markers": [
                                [
                                    51.505,
                                    -0.1
                                ],
                                [
                                    51.5,
                                    -0.09
                                ],
                                [
                                    51.51,
                                    -0.08
                                ]
                            ]
                        }
                    }
                }
            ],
            "errors": [],
            "height": 622
        },
        {
            "id": "53a712d0-8845-11e9-94c3-054beaa0f30f",
            "cellType": CellType.Markdown,
            "code": "## More charts!\r\n\r\nWant to see more charts?\r\n\r\n[Click here to see the charts example](http://open-example=charts.notebook).",
            "lastEvaluationDate": "2019-06-06T20:25:48.286+10:00",
            "output": [],
            "errors": [],
            "height": 131
        },
        {
            "id": "0ce2bcc0-9cd3-11ea-89b4-d59a11d5b26f",
            "cellType": CellType.Markdown,
            "code": "## More maps!\r\n\r\nWant to see more maps?\r\n\r\n[See the maps example](http://open-example=maps.notebook)",
            "lastEvaluationDate": "2020-05-23T18:55:16.762+10:00",
            "output": [],
            "errors": [],
            "height": 131
        },
        {
            "id": "8864e670-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Markdown,
            "code": "## More coming soon!\r\n\r\nMore visualization are coming in future editions of Data-Forge Notebook, for example:\r\n\r\n- Images\r\n- Node.js buffers\r\n- Vectors, matrices and maths formulas\r\n- Colors\r\n\r\n[Email](mailto:support@data-forge-notebook.com) and let me know what else could be added!",
            "lastEvaluationDate": "2019-10-21T16:48:16.310+10:00",
            "output": [],
            "errors": [],
            "height": 225
        }
    ]
}