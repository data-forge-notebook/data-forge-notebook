import * as React from 'react';
import { Map, Marker, Popup, TileLayer, GeoJSON } from 'react-leaflet';
import * as L from "leaflet";
import { IPluginAux } from 'host-bridge';

//
// Data to configure each marker.
//
export interface IMarkerData {
    //
    // Coordinates of the marker.
    //
    location: [number, number];

    //
    // URL of icon to display for each marker.
    //
    iconUrl?: string;

    //
    // Size of the icon in pixels.
    //
    iconSize: number | [number, number];

    //
    // Tooltip for the marker.
    //
    tooltip?: string;
}

//
// Data supplied to the Geo component.
//
export interface IGeoData {
    location?: [number, number];
    zoom?: number;
    markers?: [number, number][] | IMarkerData[];
    geojson?: any;
};

export interface IGeoProps {
    //
    // Configuration and data for the plot to be displayed.
    //
    data?: IGeoData;

    //
    // Auxillary data to pass to the plugin.
    //
    aux?: IPluginAux;
}

export class Geo extends React.Component<IGeoProps, {}> {

    //
    // Ref to the map.
    //
    map: React.RefObject<Map>;

    constructor (props: IGeoProps) {
        super(props);

        this.map = React.createRef<Map>();
    }

    //
    // Render a marker from data.
    //
    private renderMarker(key: number, marker: [number, number] | IMarkerData) {
        let location;
        let icon;
        let tooltip;
        if (Array.isArray(marker)) {
            location = marker;
        }
        else if (marker) {
            location = marker.location;

            if (marker.iconUrl || marker.iconSize !== undefined) {
                const iconDef: any = {};
                if (marker.iconUrl) {
                    if (marker.iconUrl.startsWith("http://") 
                        || marker.iconUrl.startsWith("https://")
                        || marker.iconUrl.startsWith("file://")) {
                        iconDef.iconUrl = marker.iconUrl;
                    }
                    else if (marker.iconUrl.startsWith("./")) {
                        // Assume relative path to marker icon.
                        iconDef.iconUrl = `file://${this.props.aux?.cwd}/${marker.iconUrl}`;
                    }
                    else {
                        // Assume absolute path to marker icon.
                        iconDef.iconUrl = `file://${marker.iconUrl}`;
                    }
                }

                if (marker.iconSize !== undefined) {
                    iconDef.iconSize = marker.iconSize;
                }

                icon = L.icon(iconDef);
            }

            if (marker.tooltip) {
                tooltip = marker.tooltip;
            }
        }

        if (!location) {
            return undefined; // Location not provided for marker, don't render it.
        }

        if (!tooltip) {
            tooltip = `${location[0]}, ${location[1]}`;
        }

        const optionalMarkerProps: any = {};
        if (icon) {
            optionalMarkerProps.icon = icon;
        }

        return (
            <Marker 
                key={key}
                position={location}
                {...optionalMarkerProps}
                >
                <Popup>{tooltip}</Popup>
            </Marker>
        );
    }

    render () {
        const data = this.props.data;
        return (
            <Map 
                ref={this.map}
                center={data?.location} 
                zoom={data?.zoom}
                style={{
                    width: "100%",
                    height: "100%",
                }}
                >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                    />
                {data?.markers 
                    && (data.markers as any[]).map((marker, index) => 
                        this.renderMarker(index, marker)
                )}
                {data?.geojson && <GeoJSON data={data.geojson} />}
            </Map>
        );
    }
};