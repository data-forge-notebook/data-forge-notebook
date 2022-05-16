//
// Wraps a UI component in an error boundary to catch errors.
//
// https://reactjs.org/docs/error-boundaries.html
//

import * as React from 'react';

export class ErrorBoundary extends React.Component<{ what: string, }, { hasError: boolean }> {

    constructor(props: any) {
        super(props);
      
        this.state = { hasError: false };
    }
  
    componentDidCatch(error: any, errorInfo: any): void {
        console.error(`Error in UI caught at error boundary for ${this.props.what}.`);
        console.error(error && error.stack || error);
        console.error(JSON.stringify(errorInfo, null, 4));

        this.setState({
            hasError: true,
        });
    }
  
    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div 
                    style={{
                        color: "red",
                    }}
                    >
                    <p>Something went wrong rendering {this.props.what}.</p>
                    <p>Please report this issue to <a target="_blank" href="mailto:support@data-forge-notebook.com">support@data-forge-notebook.com</a></p>
                </div>
            );
        }
  
        return this.props.children; 
    }
  }