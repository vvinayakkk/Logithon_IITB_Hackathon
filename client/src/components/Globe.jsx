import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { CloudUpload, Send, Info, Check, X, MessageCircle, FileText, Globe as GlobeIcon, Package, AlertTriangle, Calendar, Weight, DollarSign, Truck, BoxSelect, FileCheck } from 'lucide-react';
import world from '../pages/data/world.json'; // You'll need to create this file with GeoJSON data

// Separate Globe Component
const GlobeVisualization = ({ arcsData = [] }) => {
  const globeRef = useRef(null);
//   arcsData = [
//     {
//       startLat: 37.7749, // San Francisco
//       startLng: -122.4194,
//       endLat: 40.7128, // New York
//       endLng: -74.0060,
//       color: '#00E396'
//     },
//     {
//       startLat: 51.5074, // London
//       startLng: -0.1278,
//       endLat: 35.6895, // Tokyo
//       endLng: 139.6917,
//       color: '#FF4560'
//     },
//     {
//       startLat: -33.8688, // Sydney
//       startLng: 151.2093,
//       endLat: 55.7558, // Moscow
//       endLng: 37.6173,
//       color: '#775DD0'
//     }
//   ];
  // Setup globe rotation
  useEffect(() => {
    if (globeRef.current) {
      // Start with random rotation
      let rotation = Math.random() * 360;
      
      // Auto rotate globe
      const interval = setInterval(() => {
        rotation += 0.50; // Slow rotation speed
        if (globeRef.current) {
          globeRef.current.pointOfView({
            lat: 5 * Math.sin(rotation * Math.PI / 180),
            lng: rotation,
            altitude: 2.5
          }, 0);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="w-full h-72 md:h-80 lg:h-96 rounded-xl overflow-hidden">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        width={window.innerWidth}
        height={400}
        hexPolygonsData={world.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonColor={() => 'rgba(255,255,255,0.1)'}
        atmosphereColor="rgba(60, 80, 180, 0.3)"
        atmosphereAltitude={0.15}
        arcsData={arcsData}
        arcColor={(d) => d.color || '#5D3FD3'}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
      />
    </div>
  );
};

export default GlobeVisualization;