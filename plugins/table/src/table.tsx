import * as React from 'react';
import typy from "typy";

//
// Represents a table.
//
export interface ITable {
    //
    // Columns to display (fields in the data) and the order in which to display them.
    //
    columns: string[]; 

    //
    // The data to display in the table.
    //
    rows: any[];
}

export interface ITableProps {
    //
    // Data to be displayed.
    //
    table?: ITable | any;
}

export class Table extends React.Component<ITableProps, {}> {

    render () {

        let table = this.props.table;
        if (!table) {
            return (
                <div>Table data not provided</div>
            );
        }

        if (typy(table).isObject) {
            if (!Array.isArray(table.columns) || !Array.isArray(table.rows)) {
                //
                // Don't have correct fields for proper table format.
                // Just convert the object to a table.
                //
                table = {
                    columns: ["Field", "Value"],
                    rows: Object.entries(table),
                };
            }
        }
        else if (typy(table).isArray) {
            if (table.length === 0) {
                table = {
                    columns: [],
                    rows: [],
                };
            }
            else if (typy(table[0]).isObject) {
                const columns = Object.keys(table[0]);
                table = {
                    columns: columns,
                    rows: table.map((row: any) => columns.map((column) => row[column])),
                };
            }
            else if (typy(table[0]).isArray) {
                table = {
                    columns: table[0],
                    rows: table.slice(1),
                };
            }
            else {
                return <div>Bad table data format</div>
            }
        }
        else {
            return <div>Bad table data format</div>
        }

        return (
            <pre
                style={{ 
                    marginTop: "0px",
                    marginBottom: "0px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                }}  
                >
                <table>
                    <thead>
                        <tr>
                            {table.columns.map((column: string, i: number) => 
                                <th key={i}>{column}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row: any[], i: number) => 
                            <tr key={i}>
                                {table.columns.map((column: string, i: number) =>
                                    <td key={i}>{row[i]}</td>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </pre>
        );
    }
};