import * as React from 'react';

//
// Represents a table.
//
export interface ITable {
    //
    // Columns to display (fields in the data) and the order in which to display them.
    //
    columnNames: string[]; 

    //
    // The data to display in the table.
    //
    rows: any[];
}

export interface ITableProps {
    //
    // Data to be displayed.
    //
    table?: ITable;
}

export class Table extends React.Component<ITableProps, {}> {

    render () {
        if (!this.props.table) {
            return (
                <div>Table data not provided</div>
            );
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
                            {this.props.table.columnNames.map((columnName, i) => 
                                <th key={i}>{columnName}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.table.rows.map((row, i) => 
                            <tr key={i}>
                                {this.props.table!.columnNames.map((columnName, i) =>
                                    <td key={i}>{row[columnName]}</td>
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </pre>
        );
    }
};