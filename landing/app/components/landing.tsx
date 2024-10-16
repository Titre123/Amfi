"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion"
import { CardContent, Card } from '@/app/components/ui/card'
import AmfiDashboardImage from "@/public/Amfi dashboard.png"
import UserDashboardImage from "@/public/user dashboard.png"
import Logo from "@/public/Amfi.png"
import { ChevronRight, Menu, X, TrendingUp, Star, Shield, Coins, Zap, Users } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function LandingPageComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [name, setName] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)

  const [heroRef, heroInView] = useInView({ triggerOnce: true })
  const [protocolRef, protocolInView] = useInView({ triggerOnce: true })
  const [testimonialsRef, testimonialsInView] = useInView({ triggerOnce: true })
  const [faqRef, faqInView] = useInView({ triggerOnce: true })

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      setIsRegistered(true)
      // Here you would typically send the data to your backend
      console.log('Registered:', name)
    }
  }

  const testimonials = [
    {
      name: "Alice",
      role: "Yield Farmer",
      quote: "AMFI's reward system has boosted my yields by 30%. The daily rewards keep me engaged and motivated!",
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      metric: "30% Higher Yields"
    },
    {
      name: "Bob",
      role: "Long-term Hodler",
      quote: "The tiered reward structure in AMFI incentivizes loyalty. I've never felt more valued as a user.",
      icon: <Star className="w-6 h-6 text-primary" />,
      metric: "5x Loyalty Multiplier"
    },
    {
      name: "Charlie",
      role: "DeFi Security Expert",
      quote: "AMFI's reward distribution is not only generous but also incredibly secure. It's a model for the industry.",
      icon: <Shield className="w-6 h-6 text-primary" />,
      metric: "100% Secure Rewards"
    }
  ];

  const features = [
    {
      icon: <Coins className="w-8 h-8 text-primary" />,
      title: "High-Yield Rewards",
      description: "Earn substantial rewards through our innovative staking mechanisms."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure Transactions",
      description: "Enjoy peace of mind with our robust security measures for all transactions."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Instant Liquidity",
      description: "Access your rewards instantly with our automated market making system."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Community Governance",
      description: "Participate in protocol decisions through our decentralized governance model."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border border-b container">
        <div className="w-full md:max-w-[750px] lg:max-w-[988px] xl:max-w-[1150px] mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold"> <Image src={Logo} alt="Amfi Logo" width={40} height={40} className="mr-2" /></Link>
          <nav className="hidden md:flex space-x-4">
            <Link href="#protocol" className="text-foreground hover:text-primary transition-colors">Protocol</Link>
            <Link href="#testimonials" className="text-foreground hover:text-primary transition-colors">Testimonials</Link>
            <Link href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</Link>
          </nav>
          <Button className="md:hidden" variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {isMenuOpen && (
          <motion.nav
            className="md:hidden flex flex-col space-y-2 p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="#protocol" className="text-foreground hover:text-primary transition-colors">Protocol</Link>
            <Link href="#testimonials" className="text-foreground hover:text-primary transition-colors">Testimonials</Link>
            <Link href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</Link>
          </motion.nav>
        )}
      </header>

      <main className="flex-grow">
        <section ref={heroRef} className="xl:min-h-screen pt-4 flex flex-col justify-center items-center container">
          <div className='w-full md:max-w-[750px] lg:max-w-[968px] xl:max-w-[1100px] flex gap-y-4 justify-center flex-col'>
            <motion.div
              className="container mx-auto px-4 flex flex-col gap-y-4 text-center"
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold">Welcome to AMFI DeFi Protocol</h1>
              <p className="text-xl">Revolutionizing decentralized finance with cutting-edge technology</p>
              <div className='flex flex-col gap-4 items-center'>
                <Link href="https://amfiuser.vercel.app/" target='_blank'>
                  <Button className='max-w-max self-center' size="lg">
                    Get Started as User<ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://amfiprotocol.vercel.app/" target='_blank'>
                  <Button className='max-w-max self-center' size="lg">
                    Get Started as Protocol <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="container mx-auto xl:min-h-[50vh] px-4 text-center"
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={AmfiDashboardImage}
                alt="AMFI Protocol Illustration"
                className="rounded-lg max-h-full"
                style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
              />
            </motion.div>
          </div>
        </section>

        <section ref={protocolRef} className="py-20 container">
          <div className="'w-full md:max-w-[750px] lg:max-w-[968px] xl:max-w-[1100px] mx-auto px-4">
            <motion.h2
              className="text-4xl font-bold mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={protocolInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Revolutionizing DeFi Rewards
            </motion.h2>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={protocolInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="text-2xl font-semibold mb-6">Powered by AMFI Technology</h3>
                <p className="mb-8 text-lg">
                  Our advanced protocol leverages AMFI technology to provide a seamless and rewarding DeFi experience.
                  Unlock the full potential of your assets with our innovative reward system.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <Card key={index} className="bg-background/50 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="mb-4">{feature.icon}</div>
                        <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button size="lg" className="mt-8">
                  Explore AMFI Rewards
                </Button>
              </motion.div>
              <motion.div
                className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl"
                initial={{ opacity: 0, x: 50 }}
                animate={protocolInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Image
                  src={UserDashboardImage}
                  alt="AMFI Protocol Dashboard"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Your Rewards Dashboard</h4>
                  <p className="text-white/80">Track your earnings and optimize your rewards in real-time</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        <section ref={testimonialsRef} className="container px-4 sm:px-0 flex justify-center py-20">
          <div className="'w-full md:max-w-[750px] lg:max-w-[968px] xl:max-w-[1100px]">
            <motion.h2
              className="text-4xl font-bold mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Empowering Users with Rewards
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        {testimonial.icon}
                        <span className="text-sm font-semibold text-primary">{testimonial.metric}</span>
                      </div>
                      <p className="mb-6 italic flex-grow">&ldquo;{testimonial.quote}&rdquo;</p>
                      <div className="flex items-center mt-auto">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                          <span className="text-xl font-bold text-primary">{testimonial.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" ref={faqRef} className="container px-4 sm:px-0 flex justify-center py-20">
          <div className="w-full md:max-w-[750px] lg:max-w-[968px] xl:max-w-[1100px]">
            <motion.div
              className="container mx-auto px-4"
              initial="hidden"
              animate={faqInView ? "visible" : "hidden"}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is AMFI?</AccordionTrigger>
                  <AccordionContent>
                    AMFI is an advanced DeFi protocol that enables high-yield staking, secure cross-chain transactions, and decentralized governance.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I get started with AMFI?</AccordionTrigger>
                  <AccordionContent>
                    To get started, simply register for an account and connect your wallet. You can then explore our various DeFi products and services.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is AMFI secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, AMFI prioritizes security. Our protocol undergoes regular audits and implements industry-leading security measures to protect user assets.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </section>

        <section id="register" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Get Started?</h2>
            {!isRegistered ? (
              <form onSubmit={handleRegister} className="max-w-md mx-auto">
                <div className="mb-4">
                  <Label htmlFor="name" className="sr-only">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-primary-foreground text-primary"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-background text-primary hover:bg-primary-foreground">
                  Register Now
                </Button>
              </form>
            ) : (
              <div>
                <p className="text-xl mb-4">Thank you for registering, {name}!</p>
                <Button size="lg" className="bg-background text-primary hover:bg-primary-foreground">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 AMFI DeFi Protocol. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="#" className="text-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="text-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-foreground hover:text-primary transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}