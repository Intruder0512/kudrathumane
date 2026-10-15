import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { INDIAN_STREET_DOGS } from '@/lib/imageUtils';

const Footer = () => {
  return (
    <footer className="bg-muted text-muted-foreground mt-20 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
        <img src={INDIAN_STREET_DOGS[5]} alt="" className="w-full h-full object-cover rounded-tl-full" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 fill-primary text-primary" />
              <span className="font-bold text-lg text-foreground">Kudrat Humane Living Trust</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Dedicated to rescuing, rehabilitating, and rehoming street dogs in India. Founded by Pooja Prasad with a mission to create a more compassionate world for our four-legged friends.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors duration-200" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors duration-200" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors duration-200" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <span className="font-semibold text-foreground mb-4 block">Quick Links</span>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors duration-200">Home</Link></li>
              <li><Link to="/dogs" className="hover:text-primary transition-colors duration-200">Dogs</Link></li>
              <li><Link to="/adoption" className="hover:text-primary transition-colors duration-200">Virtual Adoption</Link></li>
              <li><Link to="/fostering" className="hover:text-primary transition-colors duration-200">Fostering</Link></li>
              <li><Link to="/fundraising" className="hover:text-primary transition-colors duration-200">Fundraising</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-foreground mb-4 block">Contact Us</span>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Kudrat Humane Living Trust, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@kudrathumane.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Kudrat Humane Living Trust. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="#" className="hover:text-primary transition-colors duration-200">Privacy Policy</Link>
            <span>•</span>
            <Link to="#" className="hover:text-primary transition-colors duration-200">Terms of Service</Link>
          </div>
          <p className="mt-3 text-xs opacity-80">
            Indie dog photos via{' '}
            <a href="https://commons.wikimedia.org/wiki/Category:Indian_pariah_dog" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Wikimedia Commons</a>
            {' '}(free licences, credits to their photographers).
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;