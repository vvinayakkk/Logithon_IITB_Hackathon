

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShieldAlt, 
  FaGlobeAmericas, 
  FaRocket, 
  FaCheckCircle, 
  FaFileCsv, 
  FaCloudUploadAlt,
  FaChevronRight,
  FaChevronDown,
  FaWhatsapp,
  FaEnvelope,
  FaGoogle,
  FaSms,
  FaShip,
  FaLock
} from 'react-icons/fa';
import { 
  HiOutlineLightningBolt, 
  HiTranslate, 
  HiCamera 
} from 'react-icons/hi';
import { MdAutorenew, MdDevices, MdOutlineAnalytics } from 'react-icons/md';
import { SiMongodb, SiFlask, SiReact, SiTwilio } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Custom Navbar component



const WorldMap = () => {
  const position = [20, 0]; // Center of the map

  // Custom markers for different regions
  const markers = [
    { position: [37.09, -95.71], region: "Americas" },
    { position: [54.53, 15.25], region: "Europe" },
    { position: [34.05, 100.61], region: "Asia" },
    { position: [-8.78, 34.51], region: "Africa" },
    { position: [-25.27, 133.78], region: "Australia" }
  ];

  return (
    <MapContainer center={position} zoom={2} style={{ height: '400px', width: '100%', borderRadius: '16px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>
            {marker.region}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
const Navbar = ({ smoothScroll, featuresRef, techStackRef, aboutRef }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-blue-900/30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-white mr-2 font-spaceGrotesk">
              <span className="text-blue-500">Rapid</span>Compliance
            </div>
            <div className="hidden md:flex ml-8 space-x-6">
              <button onClick={() => smoothScroll(featuresRef)} className="text-gray-300 hover:text-blue-400 transition-colors">Features</button>
              <button onClick={() => smoothScroll(techStackRef)} className="text-gray-300 hover:text-blue-400 transition-colors">Tech Stack</button>
              <button onClick={() => smoothScroll(aboutRef)} className="text-gray-300 hover:text-blue-400 transition-colors">About</button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <button className="text-gray-300 hover:text-white transition-colors">Login</button>
            </Link>
            <Link to="/signup">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const LandingPage = () => {
  const scrollRef = useRef(null);
  const featuresRef = useRef(null);
  const techStackRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);

  // Smooth scrolling function
  const smoothScroll = (elementRef) => {
    elementRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Dynamic data particles effect
  const ParticleDataEffect = () => {
    const [particles, setParticles] = useState([]);
    
    useEffect(() => {
      const generateParticles = () => {
        const newParticles = [];
        for (let i = 0; i < 30; i++) {
          newParticles.push({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            speed: Math.random() * 12 + 8,
            opacity: Math.random() * 0.5 + 0.1,
            color: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB'][Math.floor(Math.random() * 4)]
          });
        }
        return newParticles;
      };
      
      setParticles(generateParticles());
      
      const interval = setInterval(() => {
        setParticles(prev => prev.map(particle => ({
          ...particle,
          y: particle.y > 100 ? -10 : particle.y + 100 / (600 / particle.speed),
          opacity: particle.y > 80 ? (100 - particle.y) / 20 * 0.5 : 
                   particle.y < 10 ? particle.y / 10 * 0.5 : 
                   particle.opacity
        })));
      }, 50);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            animate={{
              opacity: particle.opacity
            }}
            transition={{
              duration: 0.5
            }}
            style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              top: `${particle.y}%`,
              left: `${particle.x}%`,
              filter: 'blur(1px)',
              opacity: particle.opacity
            }}
          />
        ))}
      </div>
    );
  };
  
  // Custom Grid Background
  const GridBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Data Flow Lines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59,130,246,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Diagonal Grid for Data Flow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(45deg, rgba(96,165,250,0.2) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(96,165,250,0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    );
  };
  
  // Animated 3D Cubes Diagram
  const ComplianceCubes = () => {
    return (
      <div className="relative h-80 max-w-xl mx-auto mt-16">
        {/* Base Platform */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-8 bg-blue-900/30 rounded-lg backdrop-blur-sm border border-blue-500/30"
        />
        
        {/* Core Cube */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-40 
            bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl
            border border-blue-400/50 shadow-lg shadow-blue-500/30
            flex items-center justify-center"
        >
          <div className="text-white text-center">
            <FaShieldAlt className="text-5xl mx-auto mb-2" />
            <div className="font-bold">Compliance</div>
            <div className="text-xs opacity-80">Core Engine</div>
          </div>
        </motion.div>
        
        {/* Orbiting Cubes */}
        {[
          { icon: <HiOutlineLightningBolt />, label: "Real-Time", delay: 2, x: -190, y: -40, size: 100 },
          { icon: <FaGlobeAmericas />, label: "Global", delay: 2.2, x: 100, y: -10, size: 90 },
          { icon: <HiCamera />, label: "Image AI", delay: 2.4, x: -120, y: -120, size: 90 },
          { icon: <HiTranslate />, label: "Multi-lingual", delay: 2.6, x: 85, y: -100, size: 80 },
          { icon: <MdOutlineAnalytics />, label: "Analytics", delay: 2.8, x: -20, y: -120, size: 80 }
        ].map((cube, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: cube.delay,
              type: "spring",
              stiffness: 100
            }}
            className="absolute"
            style={{
              bottom: `${80 + cube.y}px`,
              left: `50%`,
              marginLeft: `${cube.x}px`,
              width: `${cube.size}px`,
              height: `${cube.size}px`
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-700 to-indigo-700 rounded-lg 
              border border-blue-400/30 shadow-lg shadow-blue-600/20
              flex flex-col items-center justify-center text-white">
              <div className="text-xl mb-1">{cube.icon}</div>
              <div className="text-xs font-medium">{cube.label}</div>
            </div>
            
            {/* Connection Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5, delay: cube.delay + 0.3 }}
              className="absolute bottom-0 left-1/2 w-1 bg-gradient-to-t from-blue-400 to-transparent"
              style={{
                height: `${Math.abs(cube.y) - cube.size/2}px`,
                transform: `translateX(-50%) translateY(${cube.size/2}px)`
              }}
            />
          </motion.div>
        ))}
        
        {/* Data Flow Particles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3.2 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 300 - 150,
                y: Math.random() * 100 + 150,
                opacity: 0
              }}
              animate={{
                x: Math.random() * 80 - 40,
                y: Math.random() * 50 + 60,
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: Math.random() * 2 + 3,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute w-2 h-2 rounded-full bg-blue-400"
            />
          ))}
        </motion.div>
      </div>
    );
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: <FaGlobeAmericas className="text-blue-400" />,
      title: "Real-Time Global Compliance Database",
      description: "Verified knowledge graph from government, FedEx, UPS, and international shipping sources. Get accurate rules in microseconds."
    },
    {
      icon: <FaShieldAlt className="text-indigo-400" />,
      title: "Deep Compliance Checks",
      description: "Enter any country for prohibited items, or query any item to see which countries ban it. Export results in multiple formats."
    },
    {
      icon: <HiCamera className="text-cyan-400" />,
      title: "AI Image Compliance Detection",
      description: "Upload or scan any image—our YOLOv11 OBB model (99.2% accuracy) instantly detects items and checks compliance across countries."
    },
    {
      icon: <FaFileCsv className="text-teal-400" />,
      title: "Bulk Compliance Processing",
      description: "Upload shipment details via CSV—our RAG model analyzes hundreds of entries in seconds with parallel processing."
    },
    {
      icon: <MdAutorenew className="text-green-400" />,
      title: "Live Data Feeds & AI Agents",
      description: "Continuous updates via web scrapers and AI agents. 22 FedEx rules auto-checked in real-time for every shipment."
    },
    {
      icon: <HiTranslate className="text-purple-400" />,
      title: "Multilingual Global Support",
      description: "Get compliance insights in French, Spanish, Chinese, Hindi, and more—accessible anywhere, anytime."
    }
  ];

  const techStackItems = [
    {
      icon: <SiFlask className="text-sky-400" />,
      title: "Flask Backend",
      description: "Powerful Python Flask backend with microservices architecture for parallel compliance processing."
    },
    {
      icon: <SiMongodb className="text-green-400" />,
      title: "MongoDB Database",
      description: "Flexible document storage for our extensive compliance knowledge graph and shipping rules."
    },
    {
      icon: <SiReact className="text-blue-400" />,
      title: "React & React Native",
      description: "Beautiful, responsive interfaces for both web and mobile platforms with seamless user experience."
    },
    {
      icon: <SiTwilio className="text-purple-400" />,
      title: "Twilio Integration",
      description: "Instant notification delivery via SMS, WhatsApp, and email for real-time compliance alerts."
    }
  ];

  return (
    <div ref={scrollRef} id="top" className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <Navbar 
        smoothScroll={smoothScroll}
        featuresRef={featuresRef}
        techStackRef={techStackRef}
        aboutRef={footerRef}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background Elements */}
        <GridBackground />
        <ParticleDataEffect />

        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        {/* Main Content */}
        <div className="container mx-auto text-center z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Central button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.5
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-8 bg-blue-900/30 backdrop-blur-md text-blue-200 px-6 py-3 rounded-full 
                flex items-center space-x-2 mx-auto hover:bg-blue-800/40 transition-all duration-300
                border border-blue-500/30 shadow-lg shadow-blue-500/20"
            >
              <FaShieldAlt className="text-blue-300" />
                <span>Rapid Compliance Checker</span>
              <FaChevronRight className="text-blue-400" />
            </motion.button>

            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-6xl md:text-7xl font-bold mb-4 font-spaceGrotesk leading-tight"
            >
              <motion.span 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="bg-gradient-to-r from-white via-blue-100 to-white text-transparent bg-clip-text"
              >
                Cross-border
              </motion.span>
              <br />
              <motion.span 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400 text-transparent bg-clip-text"
              >
                Compliance Revolution
              </motion.span>
            </motion.h1>
            
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="text-xl text-blue-100 mb-12 font-outfit max-w-2xl mx-auto"
            >
              AI-powered shipping compliance in seconds. No more guesswork, fines, or delays.
            </motion.p>

            {/* 3D Visualization */}
            <ComplianceCubes />

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, delay: 3.5 }}
              className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4 mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 rounded-full font-outfit 
                  hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25
                  flex items-center justify-center space-x-2"
              >
                <FaRocket className="text-blue-200" />
                <span>Start Free Trial</span>
              </motion.button>
              
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border border-blue-700 bg-blue-900/20 backdrop-blur-sm px-8 py-4 rounded-full font-outfit 
                    hover:bg-blue-800/30 transition-all duration-300 text-blue-100
                    flex items-center justify-center space-x-2"
                >
                  <HiOutlineLightningBolt className="text-blue-300" />
                  <span>Interactive Demo</span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 4, duration: 0.8 }}
          className="absolute bottom-8 left-8 flex items-center space-x-2 text-blue-300"
        >
          <FaChevronDown className="animate-bounce" />
          <span className="text-sm">Discover More</span>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gradient-to-b from-black via-blue-950/20 to-black">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white font-spaceGrotesk"
          >
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
              Game-Changing Features
            </span>
          </motion.h2>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-blue-950/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-900/50 
                  hover:bg-blue-900/30 transition-all duration-300 transform hover:-translate-y-2
                  shadow-lg shadow-blue-900/20"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-white font-outfit">
                  {feature.title}
                </h3>
                <p className="text-blue-200 font-inter">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section ref={techStackRef} className="py-20 bg-gradient-to-b from-black to-blue-950/20">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white font-spaceGrotesk"
          >
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
              Powered By Advanced Technology
            </span>
          </motion.h2>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            {techStackItems.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-blue-950/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-900/50 
                  hover:bg-blue-900/30 transition-all duration-300 transform hover:-translate-y-2
                  shadow-lg shadow-blue-900/20"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-white font-outfit">
                    {item.title}
                  </h3>
                </div>
                <p className="text-blue-200 font-inter">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Capabilities Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-8 rounded-2xl border border-blue-500/30
              backdrop-blur-md max-w-4xl mx-auto shadow-xl shadow-blue-900/20"
          >
            <h3 className="text-2xl font-bold mb-4 text-center text-white">
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 text-transparent bg-clip-text">
                AI & Machine Learning Capabilities
              </span>
            </h3>
            <ul className="space-y-4">
              {[
                "YOLOv11 OBB object detection with 99.2% accuracy for prohibited item recognition",
                "Graph RAG knowledge base continuously updating with new compliance rules",
                "Reinforcement learning that improves accuracy through usage patterns",
                "NLP model for automatic report generation and compliance insights",
                "AI agents and web scrapers continuously monitoring global regulations"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <FaCheckCircle className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-blue-100">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white font-spaceGrotesk"
          >
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">
              Global Delivery & Integrations
            </span>
          </motion.h2>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { icon: <FaGoogle className="text-4xl text-white" />, name: "Google Cloud" },
              { icon: <FaWhatsapp className="text-4xl text-white" />, name: "WhatsApp Alerts" },
              { icon: <FaSms className="text-4xl text-white" />, name: "SMS Notifications" },
              { icon: <FaEnvelope className="text-4xl text-white" />, name: "Email Reports" },
            ].map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center justify-center p-6 rounded-xl 
                  bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-700/30
                  hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300
                  backdrop-blur-sm"
              >
                <div className="mb-4">{service.icon}</div>
                <p className="text-blue-200 font-medium text-center">{service.name}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Global Presence Map */}
          {/* Global Presence Map */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.3 }}
  viewport={{ once: true }}
  className="mt-24 max-w-4xl mx-auto relative"
>
  <h3 className="text-2xl font-bold mb-8 text-center">
    <span className="bg-gradient-to-r from-blue-300 to-indigo-300 text-transparent bg-clip-text">
      Global Compliance Coverage
    </span>
  </h3>
  <div className="relative h-64 md:h-80 bg-blue-950/20 rounded-2xl overflow-hidden border border-blue-700/30">
    <WorldMap />
    
    {/* Stats overlay */}
    <div className="absolute bottom-4 left-4 right-4 flex justify-between">
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg px-4 py-2 text-center border border-blue-500/30">
        <div className="text-xl font-bold text-white">195+</div>
        <div className="text-xs text-blue-200">Countries</div>
      </div>
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg px-4 py-2 text-center border border-blue-500/30">
        <div className="text-xl font-bold text-white">8,500+</div>
        <div className="text-xs text-blue-200">Regulations</div>
      </div>
      <div className="bg-blue-900/50 backdrop-blur-sm rounded-lg px-4 py-2 text-center border border-blue-500/30">
        <div className="text-xl font-bold text-white">99.2%</div>
        <div className="text-xs text-blue-200">Accuracy</div>
      </div>
    </div>
  </div>
</motion.div>        </div>
      </section>

      {/* Call to Action */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-b from-blue-950/20 to-black relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -100, y: Math.random() * 100 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                x: [null, window.innerWidth + 100],
                y: [null, Math.random() * 100]
              }}
              transition={{ 
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                delay: Math.random() * 10
              }}
              className="absolute h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              style={{ 
                width: Math.random() * 300 + 100,
                top: `${Math.random() * 100}%`,
                left: -100
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-gradient-to-br from-blue-900/40 to-indigo-900/40 
              rounded-3xl p-12 border border-blue-500/30 backdrop-blur-md
              shadow-xl shadow-blue-900/30 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-spaceGrotesk">
              <span className="bg-gradient-to-r from-white to-blue-100 text-transparent bg-clip-text">
                Ready to Transform Your Shipping Compliance?
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 500+ companies that have eliminated compliance fines and shipping delays with our AI-powered platform.
            </p>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="flex flex-wrap justify-center gap-4 mb-10"
            >
              {[
                { icon: <FaLock />, text: "99.99% Uptime SLA" },
                { icon: <FaShip />, text: "Custom Integration" },
                { icon: <MdDevices />, text: "Multi-Platform" },
                { icon: <FaCloudUploadAlt />, text: "Cloud-Based Solution" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center bg-blue-900/30 rounded-full px-4 py-2 border border-blue-700/30"
                >
                  <span className="text-blue-400 mr-2">{item.icon}</span>
                  <span className="text-blue-100">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-5 rounded-full font-bold 
                text-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-300
                flex items-center space-x-3 mx-auto"
            >
              <FaRocket className="text-blue-200" />
              <span>Start Your Free 14-Day Trial</span>
            </motion.button>
            
            <p className="text-blue-300 mt-6 text-sm">No credit card required. Cancel anytime.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="bg-blue-950/40 py-12 border-t border-blue-900/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4 font-spaceGrotesk">
                <span className="text-blue-500">Rapid</span>Compliance
              </div>
              <p className="text-blue-200 mb-4">
                AI-powered shipping compliance for the modern world. Protect your business from costly mistakes.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Icons Would Go Here */}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Integrations", "Pricing", "Enterprise", "Updates"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-blue-300 hover:text-blue-100 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {["Documentation", "API", "Guides", "Status", "Blog"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-blue-300 hover:text-blue-100 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Customers", "Careers", "Contact", "Privacy"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-blue-300 hover:text-blue-100 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-800/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-400 text-sm">
              © 2025 RapidCompliance. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">Terms of Service</a>
              <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">Privacy Policy</a>
              <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
