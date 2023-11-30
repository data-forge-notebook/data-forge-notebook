//
// Renders structured data.
//

import * as React from 'react';
import Visualiser from './lib/visualiser/Visualiser';

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
                    paddingLeft: "24px",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                }}  
                >
                <Visualiser
                    data={data}
                    useHljs={true}
                    />
            </div>
        );
    }
};