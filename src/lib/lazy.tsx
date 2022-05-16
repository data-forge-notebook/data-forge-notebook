import * as React from 'react';
import { isElementPartiallyInViewport } from './viewport';
import * as _ from 'lodash';

const LAZY_PADDING = 50;

//#if dev
const FORCE_MOUNT = false; // Force mount early.
const DONT_MOUNT = false; // Stop mounting altogether.
//#endif dev

export interface ILazyProps {

    //
    // For debugging.
    //
    id: string;

    //
    // The height of the element (if known).
    //
    height: number | undefined;

    //
    // Force the lazy element to be immediately mounted.
    //
    forceMount: boolean;

    //
    // Event raised when the lazy component is mounted.
    //
    onMounted: () => void;
}

export interface ILazyState {
}

export class Lazy extends React.Component<ILazyProps, ILazyState> {

    //
    // The HTML element that contains the rendered markdown
    //
    private lazyElement: React.RefObject<HTMLDivElement>;

    //
    // Set to true if the events have been hooked.
    //
    private eventsHooked: boolean = false;

    //
    // The testVisible function throttled for better performance.
    //
    private testVisibleThrottled: _.DebouncedFunc<any>;

    //
    // Set to true if the element is visible and should be rendered.
    //
    private mounted: boolean = false;

    constructor(props: ILazyProps) {
        super(props);

        this.lazyElement = React.createRef<HTMLDivElement>();

        this.mounted = this.props.height === undefined;

        this.testVisible = this.testVisible.bind(this);
        this.testVisibleThrottled = _.throttle(this.testVisible.bind(this), 200, { leading: false, trailing: true });
    }

    componentDidMount() {
        //#if dev
        if (DONT_MOUNT) {
            return;
        }

        if (FORCE_MOUNT) {
            this.makeVisible();
            return;
        }
        //#endif dev

        if (this.mounted) {
            // Already mounted.
        }
        else {
            if (this.testVisible()) {
                // Component is already visible.
            }
            else {
                // Component is offset, hook events and wait until it is visible.
                this.hookEvents();
            }
        }
    }

    componentWillUnmount() {
        this.unhookEvents();
    }

    //
    // Hook events required to make check if the component should be made visible.
    //
    private hookEvents() {
        if (!this.eventsHooked) {
            window.addEventListener("resize", this.testVisibleThrottled);
            window.addEventListener("scroll", this.testVisibleThrottled);
            this.eventsHooked = true;
        }
    }

    //
    // Unhook events.
    //
    private unhookEvents() {
        if (this.eventsHooked) {
            window.removeEventListener("resize", this.testVisibleThrottled);
            window.removeEventListener("scroll", this.testVisibleThrottled);
            this.eventsHooked = false;
        }
    }

    //
    // Tests if the component should be visible and if it should makes it visible.
    //
    private testVisible(): boolean {
        if (this.lazyElement.current) {
            if (isElementPartiallyInViewport(this.lazyElement.current, LAZY_PADDING)) {
                this.makeVisible();
                return true;
            }
        }

        return false;
    }

    //
    // Makes the component visible.
    //
    private makeVisible(): void {
        if (this.mounted) {
            return;
        }

        this.unhookEvents();

        this.mounted = true;
        this.forceUpdate(() => {
            this.props.onMounted();
        });
    }

    render() {
        if (!this.mounted && this.props.forceMount) {
            this.makeVisible();
        }

        if (!this.mounted) {
            const placeholderStyle: any = {
                height: this.props.height,
            };
            //#if dev
            if (DONT_MOUNT) {
                placeholderStyle.border = "1px solid red";
            }
            //#endif dev
            return <div
                id={this.props.id}
                ref={this.lazyElement}
                style={placeholderStyle}
                />;
        }

        return (
            <div id={this.props.id}>
                {this.props.children}
            </div>
        );
    }
}