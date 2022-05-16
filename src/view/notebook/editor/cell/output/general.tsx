import * as React from 'react';

export interface IGeneralProps {
    value: any;
}

export class General extends React.Component<IGeneralProps, {}> {

    constructor (props: IGeneralProps) {
        super(props);
    }

    render() {
        return (
            <span>{this.props.value}</span>
        );
    }
}

