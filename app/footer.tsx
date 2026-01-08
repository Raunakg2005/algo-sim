"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Twitter, Linkedin, Github, Instagram } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  const [lastScanTime, setLastScanTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setLastScanTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A] text-white py-10 px-6">
      <div className="mb-8"></div><div className="mb-8"></div>
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-8">
        {/* Brand, Tagline & Quick Links */}
        
        <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
          <h3 className="text-3xl font-extrabold text-white mb-2">
            Algo-Sim
          </h3>
          <p className="text-xl font-medium text-white/80 mb-4">
            Learn algorithms through interactive visualizations
          </p>
          <ul className="flex space-x-8">
            {quickLinks.map((item) => (
              <motion.li
                key={item.label}
                whileHover={{ scale: 1.1 }}
                className="cursor-pointer font-medium text-blue-400 mb-4 hover:text-blue-400"
              >
                <Link href={item.href}>{item.label}</Link>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Social Media */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold text-white mb-3">
            Follow Us
          </h3>
          <div className="flex space-x-6">
            {[
              { Icon: Instagram, href: "https://www.instagram.com/ohh.itz_rkg" },
              { Icon: Linkedin, href: "https://www.linkedin.com/in/raunak-kumar-gupta-7b3503270" },
              { Icon: Github, href: "https://github.com/Raunakg2005" },
            ].map(({ Icon, href }, index) => (
              <motion.a
            key={index}
            whileHover={{ scale: 1.1, rotate: 15 }}
            className="text-white font-medium text-blue-400 mb-4 cursor-pointer"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
              >
            <Icon className="w-7 h-7" />
              </motion.a>
            ))}
          </div>
        </div>
        </div>  

      {/* Footer Bottom */}
      <div className="mt-2 text-center text-white/80">
        <p className="text-sm">
          © 2026 Algo-Sim. All rights reserved. | Developed by SwDC-KJSCE
        </p>
      </div>
    </footer>
  );
};

export default Footer;
