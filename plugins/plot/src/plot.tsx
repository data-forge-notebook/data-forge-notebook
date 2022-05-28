import * as React from 'react';
import { IChartDef } from "@plotex/chart-def";
import * as apex from "@plotex/lib-apex";
import { deepCompare } from 'host-bridge';

export interface IPlotProps {
    //
    // Configuration and data for the plot to be displayed.
    //
    data?: IChartDef;
}

export class Plot extends React.Component<IPlotProps, {}> {

    containerElement: React.RefObject<HTMLDivElement>;

    chart?: apex.IChart;

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

        try {
            const plotDef = Object.assign({}, this.props.data);

            // Make the chart fill its container (almost fill)
            plotDef.plotConfig.width = "95%"; 
            plotDef.plotConfig.height = "95%";

            const mountOptions: apex.IMountOptions = {
                showChartDef: false,
                enableAnimations: false,
            }

            this.chart = await apex.mountChart(plotDef, this.containerElement.current!, mountOptions);
            this.chart.sizeToFit();
        }
        catch (err: any) {
            console.error("Failed to render chart.");
            console.error(err && err.stack || err);
        }
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.unmount();
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