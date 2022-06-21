import { CellScope, CellType } from "./model/cell";
import { ISerializedNotebook1 } from "./model/serialization/serialized1";

export const testNotebook: ISerializedNotebook1 = {
    "version": 3,
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
            "code": "## Plain ol' console logging\r\n\r\nUse `console.log` to output whatever you want:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "f0627130-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "let data = \"Whatever you want to log!\";\r\nconsole.log(data);",
            "lastEvaluationDate": "2020-06-22T17:23:59.889+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "string",
                        "data": "Whatever you want to log!\n"
                    },
                    "height": 49
                }
            ],
            "errors": [],
            "height": 252
        },
        {
            "id": "e33a5ea0-2e9c-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## JavaScript arrays and objects\r\n\rUse the `display` function to visualize JavaScript data structures:",
            "lastEvaluationDate": "2019-02-12T18:06:37.479+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "27b6d830-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "data = { array: [1, 2, 3, 4], object: { A: 1, B: \"hello\" } };\r\ndisplay(data);",
            "lastEvaluationDate": "2020-06-22T17:24:08.138+10:00",
            "output": [
                {
                    "value": {
                        "displayType": "object",
                        "data": {
                            "array": [
                                1,
                                2,
                                3,
                                4
                            ],
                            "object": {
                                "A": 1,
                                "B": "hello"
                            }
                        }
                    },
                    "height": 74
                }
            ],
            "errors": [],
            "height": 252
        },
        {
            "id": "0ee8ed00-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## Visualize data from CSV or JSON files\r\n\r\nUse [datakit](https://www.npmjs.com/package/datakit) to read data files and visualize with the `display.table` function.",
            "lastEvaluationDate": "2019-02-12T18:06:37.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "31ae9260-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "const datakit = require('datakit');\r\ndata = await datakit.readCsv(\"./example.csv\");\r\ndisplay.table(data.slice(0, 5));",
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
                    },
                    "height": 218
                }
            ],
            "errors": [],
            "height": 336
        },
        {
            "id": "fc067e40-f3cd-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Markdown,
            "code": "## Charts: Plot any ol' JavaScript data!\r\n\r\nEasily create charts from JavaScript data using the function `display.plot`.",
            "lastEvaluationDate": "2019-10-21T16:48:16.310+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "24ef35e0-f3ce-11e9-97b7-a975ba8f6456",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "data = [{ D1: 50, D2: 30 }, { D1: 20, D2: 200 }, { D1: 10, D2: 100 }, { D1: 40, D2: 400 }];\r\ndisplay.plot(data);",
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
                    },
                    "height": 400
                }
            ],
            "errors": [],
            "height": 499
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
            "code": "data = {\r\n    D1: [30, 10, 50, 15],\r\n    D2: [300, 20, 10, 150],\r\n};\r\ndisplay.plot(data);",
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
                    },
                    "height": 400
                }
            ],
            "errors": [],
            "height": 556
        },
        {
            "id": "13bac060-2e9d-11e9-9f0a-97b474081a71",
            "cellType": CellType.Markdown,
            "code": "## Plot CSV and JSON files!\r\n\r\nEasily load and plot CSV and JSON data with [datakit](https://www.npmjs.com/package/datakit).",
            "lastEvaluationDate": "2019-02-12T18:06:37.480+10:00",
            "output": [],
            "errors": [],
            "height": 102
        },
        {
            "id": "3736bd70-a804-11e8-b3eb-53e94e633165",
            "cellType": CellType.Code,
            "cellScope": CellScope.Local,
            "code": "data = await datakit.readCsv(\"./example.csv\");\r\ndisplay.plot(data);",
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
                    },
                    "height": 400
                }
            ],
            "errors": [],
            "height": 499
        }
    ]
};