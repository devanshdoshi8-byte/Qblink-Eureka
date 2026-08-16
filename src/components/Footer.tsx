import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/qblink-logo.png";

const Footer = () => (
  <footer className="bg-foreground text-background/80 py-16">
    <div className="section-container px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-xl font-bold text-background">Qblink</span>
          </div>
          <p className="text-sm leading-relaxed text-background/60">
            Turning unpredictable walk-in traffic into structured, manageable flow.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-background mb-4 text-sm">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
            <li><a href="#industries" className="hover:text-background transition-colors">Industries</a></li>
            <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
            <li><a href="#affiliate" className="hover:text-background transition-colors">Affiliate Program</a></li>
            <li><a href="#about" className="hover:text-background transition-colors">About</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-background mb-4 text-sm">Legal</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-background mb-4 text-sm">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="mailto:teamqblink@gmail.com" className="flex items-center gap-2 hover:text-background transition-colors"><Mail className="w-4 h-4" /> teamqblink@gmail.com</a></li>
            <li><a href="mailto:qblinkofficial@gmail.com" className="flex items-center gap-2 hover:text-background transition-colors"><Mail className="w-4 h-4" /> qblinkofficial@gmail.com</a></li>
            <li><a href="tel:+919372090507" className="flex items-center gap-2 hover:text-background transition-colors"><Phone className="w-4 h-4" /> +91 9372090507</a></li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/20 pt-8 text-center text-xs text-background/80">
        © {new Date().getFullYear()} Qblink. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
