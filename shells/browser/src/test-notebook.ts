
export const testNotebook: any = {
    "version": 3,
    "nodejs": "14.17.4",
    "cells": [
        {
            "id": "e297e6d1-3249-11ec-ae8f-ef3292b6499b",
            "cellType": "code",
            "code": "display([\r\n    [ \"timestamp\", \"open\", \"high\", \"low\", \"close\" ],\r\n    [1, 2, 3, 4, 5],\r\n    [1, 2, 3, 4, 5],\r\n    [1, 2, 3, 4, 5],\r\n], \"table\");\r\n\r\ndisplay([\r\n    { x: \"1\", y: \"a\" },\r\n    { x: \"2\", y: \"b\" },\r\n], \"table\");\r\n\r\ndisplay({\r\n    x: \"1\",\r\n    y: \"a\",\r\n}, \"table\");",
            "output": [
                {
                    "value": {
                        "displayType": "table",
                        "data": [
                            [
                                "timestamp",
                                "open",
                                "high",
                                "low",
                                "close"
                            ],
                            [
                                1,
                                2,
                                3,
                                4,
                                5
                            ],
                            [
                                1,
                                2,
                                3,
                                4,
                                5
                            ],
                            [
                                1,
                                2,
                                3,
                                4,
                                5
                            ]
                        ]
                    }
                },
                {
                    "value": {
                        "displayType": "table",
                        "data": [
                            {
                                "x": "1",
                                "y": "a"
                            },
                            {
                                "x": "2",
                                "y": "b"
                            }
                        ]
                    }
                },
                {
                    "value": {
                        "displayType": "table",
                        "data": {
                            "x": "1",
                            "y": "a"
                        }
                    }
                }
            ],
            "errors": []
        }
    ]
};