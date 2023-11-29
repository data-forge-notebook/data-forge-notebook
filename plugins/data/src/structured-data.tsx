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
                    marginTop: "0px",
                    marginBottom: "0px",
                    paddingLeft: "24px",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                    width: "100%",
                    height: "100vh",
                    overflow: "auto"
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