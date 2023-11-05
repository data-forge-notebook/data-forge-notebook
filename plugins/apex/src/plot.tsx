import * as React from 'react';
import { deepCompare } from 'host-bridge';
import ApexCharts from 'apexcharts';

export interface IPlotProps {
    //
    // Configuration and data for the plot to be displayed.
    //
    data?: any;
}

export class Plot extends React.Component<IPlotProps, {}> {

    containerElement: React.RefObject<HTMLDivElement>;

    chart?: ApexCharts;

    constructor (props: IPlotProps) {
        super(props);

        this.state = {
            useApex: true,
        };
        
        this.containerElement = React.createRef();
    }

    async componentDidMount(): Promise<void> {
        await this.generateChart();
    }

    componentDidUpdate(prevProps: IPlotProps) {
        if (!deepCompare(this.props.data, prevProps.data)) {
            this.generateChart();
        }
    }


    componentWillUnmount() {
        this.destroyChart();
    }
    
    private async generateChart(): Promise<void> {

        this.destroyChart();

        if (!this.props.data) {
            // No chart data to render.
            return;
        }

        if (this.props.data.chart === undefined) {
            // Default.
            this.props.data.chart = {};
        }

        if (this.props.data.chart.height === undefined) {
            // Default to height of container.
            this.props.data.chart.height = "100%";
        }

        if (this.props.data.chart.type === undefined) {
            // Default to line charts.
            this.props.data.chart.type = "line";
        }

        try {
            this.chart = new ApexCharts(this.containerElement.current!, this.props.data);
            this.chart.render();
        }
        catch (err: any) {
            console.error("Failed to render chart.");
            console.error(err && err.stack || err);
        }
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = undefined;
        }
    }   
    
    render () {
        // Apex Charts has two container divs because it modifies the style of both!
        return (
            <div
                style={{
                    height: "100%",
                    paddingRight: "5px",
                }}
                >
                <div ref={this.containerElement} />
            </div>
        );

    }
};