// src/components/CreatePostMap.tsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// These imports will now work once you add the declaration file
import circle from "@turf/circle";
import type { Feature, Polygon } from "geojson";


interface CreatePostMapProps {
  center: [number, number]; // [lng, lat]
  radius: number;           // in meters
  height?: string;
}

const CreatePostMap: React.FC<CreatePostMapProps> = ({
  center,
  radius,
  height = "300px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Replace with your API key or load it securely from your environment
  const apiKey =
    "v1.public.eyJqdGkiOiI0MDIyNGJiZi1jYjc5LTRkYzctYjk1ZS00ODliMzMzNDhmZWIifSFZnpTe2cW87VZm9B0XdYxsZwrv5TvvuPnL5PDUEX3EP5f5yjzr-EilKUnpr1a_1bcj7Ejol6V8swHsfoutc-8tEyDTRcs9NrCMb8JyOEfDF9uPnNHDkl1ytImmVuiS_RrqUyycixaTjb7coRKR6SWlbSlZF0co16IdByJ3RbNodimnCbt7tJexuNofdyUuk9lbPnaMIkOBF8I883ZtnhNFnyk3bV5ETeetYD5Tsp_RREbImsRh0Q__96LMzECnji2AgHeHSRn_PDqwJXqWOahcpHdD0eZEEVxYMIiDZGaqnVlK_CYw20NpPMrrLPyY6GUl7R9LZFSxm3atre3S5pU.ZGQzZDY2OGQtMWQxMy00ZTEwLWIyZGUtOGVjYzUzMjU3OGE4";

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const region = "eu-west-1";
    const mapName = "FlatchatMap";

    // Construct the style URL with the API key.
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: center,
      zoom: 15,
      style: styleUrl,
      transformRequest: (url: string, resourceType?: string) => {
        if (resourceType === "Tile" || resourceType === "Source") {
          const delimiter = url.indexOf("?") > -1 ? "&" : "?";
          return { url: `${url}${delimiter}key=${apiKey}` };
        }
        return { url };
      },
    });

    map.addControl(new maplibregl.NavigationControl({}), "top-left");

    map.on("load", () => {
      // Generate a circle polygon around the center with the specified radius.
      const circlePolygon: Feature<Polygon> = circle(center, radius, {
        steps: 64,
        units: "meters",
      });
      
      // Add/update the 'geofence' source with the circle polygon.
      if (map.getSource("geofence")) {
        (map.getSource("geofence") as maplibregl.GeoJSONSource).setData(circlePolygon);
      } else {
        map.addSource("geofence", {
          type: "geojson",
          data: circlePolygon,
        });
      }

      // Add a fill layer for the circle.
      if (!map.getLayer("geofence-fill")) {
        map.addLayer({
          id: "geofence-fill",
          type: "fill",
          source: "geofence",
          layout: {},
          paint: {
            "fill-color": "#088",
            "fill-opacity": 0.2,
          },
        });
      }
      // Add an outline layer for the circle.
      if (!map.getLayer("geofence-outline")) {
        map.addLayer({
          id: "geofence-outline",
          type: "line",
          source: "geofence",
          layout: {},
          paint: {
            "line-color": "#088",
            "line-width": 2,
          },
        });
      }
    });

    // Clean up on component unmount.
    return () => {
      map.remove();
    };
  }, [center, radius, apiKey]);

  return <div ref={mapContainerRef} style={{ width: "100%", height }} />;
};

export default CreatePostMap;
