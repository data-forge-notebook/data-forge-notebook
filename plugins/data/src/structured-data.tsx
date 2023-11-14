//
// Renders structured data.
//

import * as React from 'react';
import { JSONTree } from 'react-json-tree';

//
// More themes here: https://github.com/reduxjs/redux-devtools/tree/75322b15ee7ba03fddf10ac3399881e302848874/src/react/themes
//
import theme from "./themes/pop";

theme.base00 = '#FBFBFB'; // Set the background to match.

export interface IStructuredDataProps {
    //
    // The type of data being displayed.
    //
    displayType?: string;

    //
    // Data to be displayed.
    //
    data: any;
}

export class StructuredData extends React.Component<IStructuredDataProps, {}> {

    render () {

        let data = this.props.data;
        if (this.props.displayType === "json") {
            data = JSON.parse(data);
        }

        return (
            <div
                style={{ 
                    marginTop: "0px",
                    marginBottom: "0px",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                }}  
                >
                <JSONTree 
                    data={data} 
                    theme={theme}
                    invertTheme={false}
                    />
            </div>
        );
    }
};